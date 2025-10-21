/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
"use server";

import { db } from "@/db";
import {
  document,
  documentAccess,
  documentFolders,
  documentLogs,
  documentTags,
  documentVersions,
} from "@/db/schema/documents";
import { and, DrizzleQueryError, eq } from "drizzle-orm";
import { getUser } from "../auth/dal";
import { employees } from "@/db/schema";
import { revalidatePath } from "next/cache";

interface UploadActionProps {
  title: string;
  description?: string;
  folder: string;
  public: boolean;
  departmental: boolean;
  status: string;
  Files: {
    originalFileName: string;
    filePath: string;
    fileSize: string;
    mimeType: string;
  }[];
  tags: { name: string }[];
  permissions: { view: boolean; edit: boolean; manage: boolean }[];
}

// NOTE: create personal folders on create user action

async function getUsersFolderId(folder: string) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  let folderQuery: any;

  if (user.department === folder) {
    folderQuery = await db
      .select({ id: documentFolders.id })
      .from(documentFolders)
      .where(
        and(
          eq(documentFolders.name, folder),
          eq(documentFolders.department, user.department),
          eq(documentFolders.departmental, true),
        ),
      )
      .limit(1);

    if (folderQuery.length > 0) return folderQuery;
  }

  if (folder === "public") {
    folderQuery = await db
      .select({ id: documentFolders.id })
      .from(documentFolders)
      .where(eq(documentFolders.name, "public"))
      .limit(1);

    if (folderQuery.length > 0) return folderQuery;
  }

  const existing = await db
    .select({ id: documentFolders.id })
    .from(documentFolders)
    .where(
      and(
        eq(documentFolders.name, folder),
        eq(documentFolders.createdBy, user.id),
      ),
    )
    .limit(1);

  if (existing.length > 0) return existing;

  const [newFolder] = await db
    .insert(documentFolders)
    .values({
      name: folder,
      createdBy: user.id,
      department: user.department,
      departmental: user.department === folder,
    })
    .returning({ id: documentFolders.id });

  return [newFolder];
}

export async function uploadDocumentsAction(data: UploadActionProps) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  const folderResult = await getUsersFolderId(data.folder);
  if (!folderResult.length) {
    throw new Error(`Folder '${data.folder}' not found for user`);
  }

  const folderId = folderResult[0].id;
  const isPersonal = data.folder === "personal";
  const effectivePublic = isPersonal ? false : data.public;
  const effectiveDepartmental = isPersonal ? false : data.departmental;

  try {
    await db.transaction(async (tx) => {
      const [currentCount] = await tx
        .select({ count: employees.documentCount })
        .from(employees)
        .where(eq(employees.id, user.id));

      const updatedCount = currentCount.count + data.Files.length;

      await tx
        .update(employees)
        .set({ documentCount: updatedCount })
        .where(eq(employees.id, user.id));

      const insertedDocuments = await tx
        .insert(document)
        .values(
          data.Files.map((file, idx) => ({
            title: data.Files.length > 1 ? `${data.title}-${idx}` : data.title,
            description: data.description ?? "No description",
            originalFileName: file.originalFileName,
            department: user.department,
            departmental: effectiveDepartmental,
            folderId,
            public: effectivePublic,
            uploadedBy: user.id,
            status: data.status,
          })),
        )
        .returning();

      const versionsToInsert = insertedDocuments.map((doc, index) => {
        const file = data.Files[index];
        return {
          documentId: doc.id,
          versionNumber: 1,
          filePath: file.filePath,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
          uploadedBy: user.id,
        };
      });
      const insertedVersions = await tx
        .insert(documentVersions)
        .values(versionsToInsert)
        .returning();

      for (const version of insertedVersions) {
        await tx
          .update(document)
          .set({
            currentVersionId: version.id,
            currentVersion: version.versionNumber,
          })
          .where(eq(document.id, version.documentId));
      }

      const tagsToInsert = insertedDocuments.flatMap((doc) =>
        data.tags.map((tag) => ({
          documentId: doc.id,
          tag: tag.name,
        })),
      );
      if (tagsToInsert.length > 0) {
        await tx.insert(documentTags).values(tagsToInsert);
      }

      const accessToInsert = insertedDocuments.flatMap((doc) => {
        const rows: any[] = [];
        // Uploader always has manage access
        rows.push({
          accessLevel: "manage",
          documentId: doc.id,
          userId: user.id,
          department: null,
          grantedBy: user.id,
        });
        // If departmental is enabled, add a department-level rule derived from provided permissions
        if (effectiveDepartmental) {
          const anyManage = data.permissions.some((p) => p.manage);
          const anyEdit = data.permissions.some((p) => p.edit);
          const anyView = data.permissions.some((p) => p.view);
          const deptLevel = anyManage
            ? "manage"
            : anyEdit
              ? "edit"
              : anyView
                ? "view"
                : null;

          if (deptLevel) {
            rows.push({
              accessLevel: deptLevel,
              documentId: doc.id,
              userId: null,
              department: user.department,
              grantedBy: user.id,
            });
          }
        }
        return rows;
      });
      if (accessToInsert.length > 0) {
        await tx.insert(documentAccess).values(accessToInsert);
      }

      const logsToInsert = insertedDocuments.map((doc, i) => ({
        userId: user.id,
        documentId: doc.id,
        action: "upload",
        details: `uploaded ${data.Files[i].originalFileName}`,
        documentVersionId: insertedVersions[i].id,
      }));
      await tx.insert(documentLogs).values(logsToInsert);
    });

    return {
      success: { reason: "Uploaded document/s successfully!" },
      error: null,
    };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message },
      };
    }

    return {
      error: {
        reason: "Couldn't upload document. Check inputs and try again!",
      },
      success: null,
    };
  }
}

interface UploadNewVersionProps {
  id: number;
  newVersionNumber: number;
  url?: string | null;
  fileSize: string;
  mimeType: string;
  pathname?: string;
}

export async function uploadNewDocumentVersion(data: UploadNewVersionProps) {
  console.log(data);
  const user = await getUser();
  if (!user) throw new Error("User not logged in");
  try {
    await db.transaction(async (tx) => {
      const [version] = await tx
        .insert(documentVersions)
        .values({
          versionNumber: data.newVersionNumber,
          filePath: data.url ?? "",
          mimeType: data.mimeType,
          fileSize: data.fileSize,
          uploadedBy: user.id,
          documentId: data.id,
        })
        .returning();

      await tx
        .update(document)
        .set({
          currentVersion: data.newVersionNumber,
          currentVersionId: version.id,
          updatedAt: new Date(),
          uploadedBy: user.id,
        })
        .where(eq(document.id, data.id));

      await tx.insert(documentLogs).values({
        userId: user.id,
        documentId: data.id,
        action: "upload",
        details: `uploaded new version v${data.newVersionNumber}`,
        documentVersionId: version.id,
      });
    });

    if (data.pathname) {
      revalidatePath(data.pathname);
    }
    return {
      success: { reason: "Updated version successfully" },
      error: null,
    };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message },
      };
    }

    return {
      error: {
        reason: "Couldn't upload document. Check inputs and try again!",
      },
      success: null,
    };
  }
}
