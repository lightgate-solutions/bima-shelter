"use server";

import { db } from "@/db";
import { documentFolders } from "@/db/schema";
import { and, DrizzleQueryError, eq, inArray, isNull } from "drizzle-orm";
import { getUser } from "../auth/dal";
import { revalidatePath } from "next/cache";

interface CreateFoldersProps {
  name: string;
  parentId?: number | null;
  parent?: string;
  public: boolean;
  departmental: boolean;
}

export default async function createFolder(data: CreateFoldersProps) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  if (data.name.trim().toLowerCase() === "public") {
    return {
      error: {
        reason: "Couldn't create folder. Public folder already exists",
      },
      success: null,
    };
  }

  if (data.name.trim().toLowerCase() === user.department.toLowerCase()) {
    return {
      error: {
        reason: "Couldn't create folder. Name is the same as department folder",
      },
      success: null,
    };
  }

  try {
    return await db.transaction(async (tx) => {
      let parentIdToUse: number | null = null;
      if (typeof data.parentId === "number") {
        parentIdToUse = data.parentId;
      } else if (data.parent) {
        const parentRow = await tx
          .select({ id: documentFolders.id })
          .from(documentFolders)
          .where(
            and(
              eq(documentFolders.name, data.parent),
              eq(documentFolders.createdBy, user.id),
            ),
          )
          .limit(1);
        if (parentRow.length === 0) {
          return {
            error: { reason: "Selected parent folder not found" },
            success: null,
          };
        }
        parentIdToUse = parentRow[0].id;
      }
      const existing = await tx
        .select({ name: documentFolders.name })
        .from(documentFolders)
        .where(
          and(
            eq(documentFolders.name, data.name),
            eq(documentFolders.createdBy, user.id),
            parentIdToUse !== null
              ? eq(documentFolders.parentId, parentIdToUse)
              : isNull(documentFolders.parentId),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        return {
          error: {
            reason: "Folder name already exists",
          },
          success: null,
        };
      }

      await tx.insert(documentFolders).values({
        name: data.name.trim().toLowerCase(),
        parentId: parentIdToUse,
        public: data.public,
        root: parentIdToUse ? false : true,
        departmental: data.departmental,
        department: user.department,
        createdBy: user.id,
      });

      revalidatePath("/documents");
      return {
        success: {
          reason: "Folder created successfully",
        },
        error: null,
      };
    });
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message },
      };
    }

    return {
      error: {
        reason: "Couldn't create folder. Check inputs and try again!",
      },
      success: null,
    };
  }
}

export async function getFoldersNames(ids: string[]) {
  if (!ids || ids.length === 0) return [];

  const numericIds = ids
    .map((id) => Number(id))
    .filter((id) => !Number.isNaN(id));

  const folders = await db
    .select({
      id: documentFolders.id,
      name: documentFolders.name,
    })
    .from(documentFolders)
    .where(inArray(documentFolders.id, numericIds));

  return numericIds.map((id) => folders.find((f) => f.id === id)?.name || null);
}

export async function getSubFolders(id: number) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  const folders = await db
    .select({
      id: documentFolders.id,
      name: documentFolders.name,
      updatedAt: documentFolders.updatedAt,
    })
    .from(documentFolders)
    .where(
      and(
        eq(documentFolders.parentId, id),
        eq(documentFolders.status, "active"),
      ),
    );

  return folders;
}
