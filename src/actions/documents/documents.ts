// biome-ignore-all lint/style/noNonNullAssertion: <>

"use server";

import { db } from "@/db";
import { and, eq, inArray } from "drizzle-orm";
import { getUser } from "../auth/dal";
import {
  document,
  documentAccess,
  documentFolders,
  documentTags,
  documentVersions,
  documentComments,
  documentLogs,
  employees,
} from "@/db/schema";
import { DrizzleQueryError, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getActiveFolderDocuments(folderId: number) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  try {
    const docs = await db.transaction(async (tx) => {
      const folder = await tx
        .select({
          id: documentFolders.id,
          name: documentFolders.name,
          createdBy: documentFolders.createdBy,
          public: documentFolders.public,
          departmental: documentFolders.departmental,
          department: documentFolders.department,
        })
        .from(documentFolders)
        .where(eq(documentFolders.id, folderId))
        .limit(1);

      if (folder.length === 0) throw new Error("Folder not found");

      const currentFolder = folder[0];
      const isOwner = currentFolder.createdBy === user.id;
      const isDepartmental =
        currentFolder.departmental &&
        currentFolder.department === user.department;
      const isPublic = currentFolder.public;

      if (!isOwner && !isDepartmental && !isPublic) {
        throw new Error("Access denied to this folder");
      }

      const documents = await tx
        .select({
          id: document.id,
          title: document.title,
          description: document.description,
          public: document.public,
          departmental: document.departmental,
          department: document.department,
          status: document.status,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
          currentVersion: document.currentVersion,
          uploader: employees.name,
          uploaderId: employees.id,
          uploaderEmail: employees.email,
          folderName: documentFolders.name,
          fileSize: documentVersions.fileSize,
          filePath: documentVersions.filePath,
          mimeType: documentVersions.mimeType,
          loggedUser: sql`${user.id}`,
        })
        .from(document)
        .leftJoin(employees, eq(document.uploadedBy, employees.id))
        .leftJoin(documentFolders, eq(document.folderId, documentFolders.id))
        .leftJoin(
          documentVersions,
          eq(documentVersions.id, document.currentVersionId),
        )
        .where(
          and(eq(document.folderId, folderId), eq(document.status, "active")),
        )
        .orderBy(sql`${document.updatedAt} DESC`);

      if (documents.length === 0) return [];

      const docIds = documents.map((d) => d.id);

      const [tags, accessRules] = await Promise.all([
        tx
          .select({
            documentId: documentTags.documentId,
            tag: documentTags.tag,
          })
          .from(documentTags)
          .where(inArray(documentTags.documentId, docIds)),

        tx
          .select({
            documentId: documentAccess.documentId,
            accessLevel: documentAccess.accessLevel,
            userId: documentAccess.userId,
            name: employees.name,
            email: employees.email,
            department: documentAccess.department,
          })
          .from(documentAccess)
          .where(inArray(documentAccess.documentId, docIds))
          .leftJoin(employees, eq(documentAccess.userId, employees.id)),
      ]);

      const visibleDocs = documents.filter((doc) => {
        const docAccess = accessRules.filter((a) => a.documentId === doc.id);

        const hasExplicitAccess = docAccess.some(
          (a) =>
            a.userId === user.id ||
            (a.department && a.department === user.department),
        );

        const canView =
          doc.public ||
          (doc.departmental && doc.department === user.department) ||
          isOwner ||
          hasExplicitAccess;

        return canView;
      });

      const enrichedDocs = visibleDocs.map((doc) => ({
        ...doc,
        tags: tags.filter((t) => t.documentId === doc.id).map((t) => t.tag),
        accessRules: accessRules
          .filter((a) => a.documentId === doc.id)
          .map((a) => ({
            accessLevel: a.accessLevel,
            userId: a.userId,
            name: a.name,
            email: a.email,
            department: a.department,
          })),
      }));

      return enrichedDocs;
    });

    return {
      success: {
        docs,
        count: docs.length,
      },
      error: null,
    };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error occurred" },
      };
    }

    console.error(err);
    return {
      error: {
        reason: "Couldn't fetch documents. Please try again.",
      },
      success: null,
    };
  }
}

export async function deleteDocumentAction(
  documentId: number,
  pathname: string,
) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");
  try {
    await db.transaction(async (tx) => {
      const doc = await tx.query.document.findFirst({
        where: eq(document.id, documentId),
      });

      if (!doc) throw new Error("Document not found");
      if (doc.uploadedBy !== user.id && user.role !== "admin") {
        throw new Error("You don't have permission to delete this document");
      }

      await Promise.all([
        tx
          .delete(documentAccess)
          .where(eq(documentAccess.documentId, documentId)),
        tx.delete(documentTags).where(eq(documentTags.documentId, documentId)),
        tx
          .delete(documentVersions)
          .where(eq(documentVersions.documentId, documentId)),
      ]);

      await tx.delete(document).where(eq(document.id, documentId));
    });

    revalidatePath(pathname);
    return {
      success: { reason: "Document deleted successfully" },
      error: null,
    };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error occurred" },
      };
    }

    console.error(err);
    return {
      error: {
        reason: "Couldn't delete document. Please try again.",
      },
      success: null,
    };
  }
}
export async function archiveDocumentAction(
  documentId: number,
  pathname: string,
) {
  try {
    const user = await getUser();
    if (!user) {
      return {
        success: null,
        error: { reason: "User not logged in" },
      };
    }

    const doc = await db.query.document.findFirst({
      where: eq(document.id, documentId),
    });

    if (!doc) {
      return {
        success: null,
        error: { reason: "Document not found" },
      };
    }
    if (doc.uploadedBy !== user.id && user.role !== "admin") {
      return {
        success: null,
        error: { reason: "You dont have permission to archive this document" },
      };
    }

    await db
      .update(document)
      .set({ status: "archived", updatedAt: new Date() })
      .where(eq(document.id, documentId));

    revalidatePath(pathname);
    return {
      success: { reason: "Document archived successfully" },
      error: null,
    };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error occurred" },
      };
    }

    console.error(err);
    return {
      error: {
        reason: "Couldn't delete document. Please try again.",
      },
      success: null,
    };
  }
}

export async function getDocumentComments(documentId: number) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  try {
    const result = await db.transaction(async (tx) => {
      const doc = await tx.query.document.findFirst({
        where: eq(document.id, documentId),
      });
      if (!doc) throw new Error("Document not found");

      const accessRows = await tx
        .select({
          userId: documentAccess.userId,
          department: documentAccess.department,
          accessLevel: documentAccess.accessLevel,
        })
        .from(documentAccess)
        .where(eq(documentAccess.documentId, documentId));

      const hasExplicitAccess = accessRows.some(
        (a) =>
          a.userId === user.id ||
          (a.department && a.department === user.department) ||
          a.accessLevel === "edit" ||
          a.accessLevel === "manage",
      );

      const canView =
        doc.public ||
        (doc.departmental && doc.department === user.department) ||
        doc.uploadedBy === user.id ||
        hasExplicitAccess;

      if (!canView) throw new Error("Access denied");

      const comments = await tx
        .select({
          id: documentComments.id,
          comment: documentComments.comment,
          createdAt: documentComments.createdAt,
          userId: documentComments.userId,
          userName: employees.name,
          userEmail: employees.email,
        })
        .from(documentComments)
        .leftJoin(employees, eq(documentComments.userId, employees.id))
        .where(eq(documentComments.documentId, documentId))
        .orderBy(sql`${documentComments.createdAt} DESC`);

      return comments;
    });

    return { success: result, error: null };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error occurred" },
      };
    }

    if (err instanceof Error && err.message === "Access denied") {
      return {
        success: null,
        error: { reason: "Dont have permissions to view comments" },
      };
    }
    return {
      success: null,
      error: { reason: "Couldn't fetch comments. Please try again." },
    };
  }
}

export async function addDocumentComment(documentId: number, content: string) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  if (!content || content.trim().length === 0) {
    return { success: null, error: { reason: "Comment cannot be empty" } };
  }

  try {
    const inserted = await db.transaction(async (tx) => {
      const doc = await tx.query.document.findFirst({
        where: eq(document.id, documentId),
      });
      if (!doc) throw new Error("Document not found");

      const accessRows = await tx
        .select({
          userId: documentAccess.userId,
          department: documentAccess.department,
          accessLevel: documentAccess.accessLevel,
        })
        .from(documentAccess)
        .where(eq(documentAccess.documentId, documentId));

      const hasEditOrManage = accessRows.some(
        (a) =>
          a.userId === user.id ||
          (a.department &&
            a.department === user.department &&
            (a.accessLevel === "edit" || a.accessLevel === "manage")) ||
          user.department === "admin",
      );

      const canComment = doc.uploadedBy === user.id || hasEditOrManage;
      if (!canComment) throw new Error("Access denied");

      const [commentRow] = await tx
        .insert(documentComments)
        .values({
          documentId,
          userId: user.id,
          comment: content.trim(),
        })
        .returning();

      await tx.insert(documentLogs).values({
        userId: user.id,
        documentId,
        documentVersionId: doc.currentVersionId,
        action: "comment",
        details: "added a comment",
      });

      return commentRow;
    });

    return { success: inserted, error: null };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error occurred" },
      };
    }

    if (err instanceof Error && err.message === "Access denied") {
      return {
        success: null,
        error: { reason: "Dont have permissions to comment" },
      };
    }
    return {
      success: null,
      error: { reason: "Couldn't add comment. Please try again." },
    };
  }
}

export async function deleteDocumentComment(commentId: number) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  try {
    await db.transaction(async (tx) => {
      const [commentRow] = await tx
        .select({
          id: documentComments.id,
          documentId: documentComments.documentId,
          userId: documentComments.userId,
        })
        .from(documentComments)
        .where(eq(documentComments.id, commentId))
        .limit(1);

      if (!commentRow) throw new Error("Comment not found");

      const doc = await tx.query.document.findFirst({
        where: eq(document.id, commentRow.documentId!),
      });
      if (!doc) throw new Error("Document not found");

      const accessRows = await tx
        .select({
          userId: documentAccess.userId,
          department: documentAccess.department,
          accessLevel: documentAccess.accessLevel,
        })
        .from(documentAccess)
        .where(eq(documentAccess.documentId, doc.id));

      const hasManageAccess = accessRows.some(
        (a) =>
          (a.userId === user.id ||
            (a.department && a.department === user.department)) &&
          a.accessLevel === "manage",
      );

      const isAuthor = commentRow.userId === user.id;
      const isDocOwner = doc.uploadedBy === user.id;

      if (!(isAuthor || isDocOwner || hasManageAccess)) {
        throw new Error("Access denied");
      }

      await tx
        .delete(documentComments)
        .where(eq(documentComments.id, commentId));

      await tx.insert(documentLogs).values({
        userId: user.id,
        documentId: doc.id,
        documentVersionId: doc.currentVersionId,
        action: "delete_comment",
        details: "deleted a comment",
      });
    });

    return { success: { reason: "Comment deleted successfully" }, error: null };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error occurred" },
      };
    }
    if (err instanceof Error && err.message === "Access denied") {
      return {
        success: null,
        error: { reason: "Dont have permissions to delete comment" },
      };
    }
    return {
      success: null,
      error: { reason: "Couldn't delete comment. Please try again." },
    };
  }
}

export async function getDocumentVersions(documentId: number) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  try {
    const versions = await db.transaction(async (tx) => {
      const doc = await tx.query.document.findFirst({
        where: eq(document.id, documentId),
      });
      if (!doc) throw new Error("Document not found");

      const accessRows = await tx
        .select({
          userId: documentAccess.userId,
          department: documentAccess.department,
          accessLevel: documentAccess.accessLevel,
        })
        .from(documentAccess)
        .where(eq(documentAccess.documentId, documentId));

      const hasExplicitAccess = accessRows.some(
        (a) =>
          a.userId === user.id ||
          (a.department && a.department === user.department) ||
          a.accessLevel === "edit" ||
          a.accessLevel === "manage",
      );

      const canView =
        doc.public ||
        (doc.departmental && doc.department === user.department) ||
        doc.uploadedBy === user.id ||
        hasExplicitAccess;

      if (!canView) throw new Error("Access denied");

      const rows = await tx
        .select({
          id: documentVersions.id,
          versionNumber: documentVersions.versionNumber,
          filePath: documentVersions.filePath,
          fileSize: documentVersions.fileSize,
          mimeType: documentVersions.mimeType,
          createdAt: documentVersions.createdAt,
          uploadedBy: documentVersions.uploadedBy,
          uploadedByName: employees.name,
          uploadedByEmail: employees.email,
        })
        .from(documentVersions)
        .leftJoin(employees, eq(documentVersions.uploadedBy, employees.id))
        .where(eq(documentVersions.documentId, documentId))
        .orderBy(sql`${documentVersions.createdAt} DESC`);

      return rows;
    });

    return { success: versions, error: null };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error occurred" },
      };
    }
    if (err instanceof Error && err.message === "Access denied") {
      return {
        success: null,
        error: { reason: "Dont have permissions to view versions" },
      };
    }
    return {
      success: null,
      error: { reason: "Couldn't fetch versions. Please try again." },
    };
  }
}

export async function deleteDocumentVersion(
  versionId: number,
  pathname?: string,
) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  try {
    await db.transaction(async (tx) => {
      const [version] = await tx
        .select({
          id: documentVersions.id,
          documentId: documentVersions.documentId,
          versionNumber: documentVersions.versionNumber,
        })
        .from(documentVersions)
        .where(eq(documentVersions.id, versionId))
        .limit(1);

      if (!version) throw new Error("Version not found");

      const doc = await tx.query.document.findFirst({
        where: eq(document.id, version.documentId),
      });
      if (!doc) throw new Error("Document not found");

      if (doc.currentVersionId === version.id) {
        throw new Error("Cannot delete the current version");
      }

      const accessRows = await tx
        .select({
          userId: documentAccess.userId,
          department: documentAccess.department,
          accessLevel: documentAccess.accessLevel,
        })
        .from(documentAccess)
        .where(eq(documentAccess.documentId, version.documentId));

      const hasManageAccess = accessRows.some(
        (a) =>
          (a.userId === user.id ||
            (a.department && a.department === user.department)) &&
          a.accessLevel === "manage",
      );

      const isDocOwner = doc.uploadedBy === user.id;
      if (!(isDocOwner || hasManageAccess)) {
        throw new Error("Access denied");
      }

      await tx
        .delete(documentVersions)
        .where(eq(documentVersions.id, versionId));

      await tx.insert(documentLogs).values({
        userId: user.id,
        documentId: version.documentId,
        documentVersionId: version.id,
        action: "delete_version",
        details: `deleted version v${version.versionNumber}`,
      });
    });

    if (pathname) revalidatePath(pathname);
    return { success: { reason: "Version deleted successfully" }, error: null };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error occurred" },
      };
    }
    if (err instanceof Error && err.message === "Access denied") {
      return {
        success: null,
        error: { reason: "Dont have permissions to view versions" },
      };
    }
    return {
      success: null,
      error: { reason: "Couldn't delete version. Please try again." },
    };
  }
}

export async function getDocumentLogs(documentId: number) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  try {
    const logs = await db.transaction(async (tx) => {
      const doc = await tx.query.document.findFirst({
        where: eq(document.id, documentId),
      });
      if (!doc) throw new Error("Document not found");

      const accessRows = await tx
        .select({
          userId: documentAccess.userId,
          department: documentAccess.department,
          accessLevel: documentAccess.accessLevel,
        })
        .from(documentAccess)
        .where(eq(documentAccess.documentId, documentId));

      const hasExplicitAccess = accessRows.some(
        (a) =>
          a.userId === user.id ||
          (a.department && a.department === user.department) ||
          a.accessLevel === "edit" ||
          a.accessLevel === "manage",
      );

      const canView =
        doc.public ||
        (doc.departmental && doc.department === user.department) ||
        doc.uploadedBy === user.id ||
        hasExplicitAccess;

      if (!canView) throw new Error("Access denied");

      const rows = await tx
        .select({
          id: documentLogs.id,
          action: documentLogs.action,
          details: documentLogs.details,
          createdAt: documentLogs.createdAt,
          userId: documentLogs.userId,
          userName: employees.name,
          userEmail: employees.email,
          documentVersionId: documentLogs.documentVersionId,
        })
        .from(documentLogs)
        .leftJoin(employees, eq(documentLogs.userId, employees.id))
        .where(eq(documentLogs.documentId, documentId))
        .orderBy(sql`${documentLogs.createdAt} DESC`);

      return rows;
    });

    return { success: logs, error: null };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error occurred" },
      };
    }
    if (err instanceof Error && err.message === "Access denied") {
      return {
        success: null,
        error: { reason: "Dont have permissions to view logs" },
      };
    }
    return {
      success: null,
      error: { reason: "Couldn't fetch logs. Please try again." },
    };
  }
}
