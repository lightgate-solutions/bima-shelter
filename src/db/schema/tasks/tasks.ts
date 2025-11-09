import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  index,
  date,
  integer,
  serial,
} from "drizzle-orm/pg-core";
import { taskStatusEnum, taskPriorityEnum } from "./enums";
import { employees } from "../hr";

export const tasks = pgTable(
  "tasks",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),

    assignedTo: integer("assigned_to")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),

    assignedBy: integer("assigned_by")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),

    status: taskStatusEnum("status").notNull().default("Pending"),
    priority: taskPriorityEnum("priority").notNull().default("Medium"),
    dueDate: date("due_date"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("tasks_assigned_to_idx").on(table.assignedTo),
    index("tasks_assigned_by_idx").on(table.assignedBy),
  ],
);

export const taskRelations = relations(tasks, ({ one }) => ({
  assignedTo: one(employees, {
    fields: [tasks.assignedTo],
    references: [employees.id],
    relationName: "assignedTo",
  }),
  assignedBy: one(employees, {
    fields: [tasks.assignedBy],
    references: [employees.id],
    relationName: "assignedBy",
  }),
}));
