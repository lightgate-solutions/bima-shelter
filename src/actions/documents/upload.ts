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
  permissions: { all: boolean; departmentAll: boolean; department: boolean }[];
}

// NOTE: create personal folders on create user action

export async function getUsersFolderId(folder: string) {
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
            description: data.description,
            originalFileName: file.originalFileName,
            department: user.department,
            departmental: data.departmental,
            folderId,
            public: isPersonal ? false : data.public,
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
          .set({ currentVersionId: version.versionNumber })
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
        return data.permissions.map((perm) => {
          const accessLevel = perm.all
            ? "all"
            : perm.departmentAll
              ? "write"
              : perm.department
                ? "read"
                : "none";

          return {
            accessLevel,
            documentId: doc.id,
            userId: user.id,
            department: user.department,
            grantedBy: user.id,
          };
        });
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
        reason: "Couldn't update employee. Check inputs and try again!",
      },
      success: null,
    };
  }
}
