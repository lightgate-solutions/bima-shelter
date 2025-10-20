import {
  pgTable,
  text,
  timestamp,
  index,
  integer,
  serial,
  numeric,
  boolean,
} from "drizzle-orm/pg-core";
import { employees } from "./hr";
import { relations } from "drizzle-orm";

export const documentFolders = pgTable(
  "document_folders",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    parentId: integer("parent_id"),
    department: text("department").notNull(),
    public: boolean("public").notNull().default(false),
    departmental: boolean("departmental").notNull().default(false),
    createdBy: integer("created_by")
      .references(() => employees.id)
      .notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("folders_name_idx").on(table.name),
    index("folders_department_idx").on(table.department),
  ],
);

export const foldersRelation = relations(documentFolders, ({ one }) => ({
  parent: one(documentFolders, {
    fields: [documentFolders.parentId],
    references: [documentFolders.id],
  }),
}));

export const document = pgTable(
  "document",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    originalFileName: text("original_file_name"),
    department: text("department"),
    departmental: boolean("departmental").notNull().default(false),
    folderId: integer("folder_id").references(() => documentFolders.id),
    currentVersionId: integer("current_version_id"),
    public: boolean("public").default(false),
    uploadedBy: integer("uploaded_by").references(() => employees.id),
    status: text("status").default("active").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("documents_name_idx").on(table.title),
    index("documents_version_id_idx").on(table.currentVersionId),
  ],
);

export const documentVersions = pgTable(
  "document_versions",
  {
    id: serial("id").primaryKey(),
    documentId: integer("document_id")
      .references(() => document.id)
      .notNull(),
    versionNumber: integer("version_number").notNull(),
    filePath: text("file_path").notNull(),
    fileSize: numeric("file_size", { scale: 2, precision: 10 }).notNull(),
    mimeType: text("mime_type"),
    scannedOcr: text("scanned_ocr"),
    uploadedBy: integer("uploaded_by").references(() => employees.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("documents_version_number_idx").on(table.versionNumber),
    index("documents_version_uploaded_by_idx").on(table.uploadedBy),
    index("documents_version_ocr_idx").on(table.scannedOcr),
  ],
);

export const documentTags = pgTable(
  "document_tags",
  {
    id: serial("id").primaryKey(),
    documentId: integer("document_id").references(() => document.id),
    tag: text("tag").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("documents_tag_idx").on(table.tag),
    index("documents_tag_id_idx").on(table.documentId),
  ],
);

export const documentAccess = pgTable(
  "document_access",
  {
    id: serial("id").primaryKey(),
    accessLevel: text("access_level").notNull(), // View, Edit, Manage
    documentId: integer("document_id")
      .references(() => document.id)
      .notNull(),
    userId: integer("user_id").references(() => employees.id),
    department: text("department"),
    grantedBy: integer("granted_by").references(() => employees.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("documents_access_id_idx").on(table.documentId),
    index("documents_access_level_idx").on(table.accessLevel),
    index("documents_access_granted_idx").on(table.grantedBy),
    index("documents_access_department_idx").on(table.department),
    index("documents_access_user_idx").on(table.userId),
  ],
);

export const documentLogs = pgTable(
  "document_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => employees.id),
    documentId: integer("document_id").references(() => document.id),
    documentVersionId: integer("document_version_id_log").references(
      () => documentVersions.id,
    ),
    action: text("action").notNull(),
    details: text("details"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("documents_logs_action_idx").on(table.action),
    index("documents_logs_document_idx").on(table.documentId),
  ],
);

export const documentSharedLinks = pgTable(
  "document_shared_link",
  {
    id: serial("id").primaryKey(),
    documentId: integer("document_id").references(() => document.id),
    token: text("token").unique().notNull(),
    expiresAt: timestamp("expires_at"),
    accessLevel: text("access_level").default("View"),
    createdBy: integer("created_by").references(() => employees.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("documents_shared_token").on(table.token)],
);

export const documentComments = pgTable(
  "document_comments",
  {
    id: serial("id").primaryKey(),
    documentId: integer("document_id").references(() => document.id),
    userId: integer("user_id").references(() => employees.id),
    comment: text("comment").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("document_comment_idx").on(table.comment)],
);
