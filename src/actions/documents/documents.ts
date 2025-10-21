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
          uploaderEmail: employees.email,
          folderName: documentFolders.name,
          fileSize: documentVersions.fileSize,
          filePath: documentVersions.filePath,
          mimeType: documentVersions.mimeType,
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
