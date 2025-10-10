import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  index,
  date,
  integer,
  serial,
  boolean,
} from "drizzle-orm/pg-core";

export const employmentTypeEnum = pgEnum("employment_type", [
  "Full-time",
  "Part-time",
  "Contract",
  "Intern",
]);
export const maritalStatusEnum = pgEnum("marital_status", [
  "Single",
  "Married",
  "Divorced",
  "Widowed",
]);

export const employees = pgTable(
  "employees",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    authId: text("auth_id").notNull().default(""),
    email: text("email").notNull().unique(),
    phone: text("phone"),
    staffNumber: text("staff_number").notNull(),
    role: text("role").notNull(),
    isManager: boolean("is_manager").notNull().default(false),
    department: text("department"),
    managerId: integer("manager_id"),
    dateOfBirth: date("date_of_birth"),
    address: text("address"),
    maritalStatus: maritalStatusEnum("marital_status"),
    employmentType: employmentTypeEnum("employment_type"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("employee_manager_idx").on(table.managerId),
    index("employees_department_role_idx").on(table.department, table.role),
  ],
);

export const managerRelations = relations(employees, ({ one }) => ({
  manager: one(employees, {
    fields: [employees.managerId],
    references: [employees.id],
  }),
}));
