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

import { tasks } from "./tasks/tasks";
import { taskSubmissions } from "./tasks/taskSubmissions";
import { taskReviews } from "./tasks/tasksReviews";
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

export const leaveStatusEnum = pgEnum("leave_status", [
  "Pending",
  "Approved",
  "Rejected",
  "Cancelled",
  "To be reviewed",
]);

export const leaveTypeEnum = pgEnum("leave_type", [
  "Annual",
  "Sick",
  "Personal",
  "Maternity",
  "Paternity",
  "Bereavement",
  "Unpaid",
  "Other",
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
    department: text("department").notNull(),
    managerId: integer("manager_id"),
    dateOfBirth: date("date_of_birth"),
    address: text("address"),
    maritalStatus: maritalStatusEnum("marital_status"),
    employmentType: employmentTypeEnum("employment_type"),
    documentCount: integer("document_count").default(0).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("employee_manager_idx").on(table.managerId),
    index("employees_department_role_idx").on(table.department, table.role),
  ],
);

// Leave Types table - configurable leave types
export const leaveTypes = pgTable("leave_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  maxDays: integer("max_days"),
  requiresApproval: boolean("requires_approval").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Annual Leave Settings - Global annual leave allocation
export const annualLeaveSettings = pgTable("annual_leave_settings", {
  id: serial("id").primaryKey(),
  allocatedDays: integer("allocated_days").notNull().default(30),
  year: integer("year").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Leave Applications table
export const leaveApplications = pgTable(
  "leave_applications",
  {
    id: serial("id").primaryKey(),
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    leaveType: leaveTypeEnum("leave_type").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    totalDays: integer("total_days").notNull(),
    reason: text("reason").notNull(),
    status: leaveStatusEnum("status").notNull().default("Pending"),
    approvedBy: integer("approved_by").references(() => employees.id),
    approvedAt: timestamp("approved_at"),
    rejectionReason: text("rejection_reason"),
    appliedAt: timestamp("applied_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("leave_applications_employee_idx").on(table.employeeId),
    index("leave_applications_status_idx").on(table.status),
    index("leave_applications_dates_idx").on(table.startDate, table.endDate),
  ],
);

// Leave Balances table - tracks remaining leave days per employee
export const leaveBalances = pgTable(
  "leave_balances",
  {
    id: serial("id").primaryKey(),
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    leaveType: leaveTypeEnum("leave_type").notNull(),
    totalDays: integer("total_days").notNull().default(0),
    usedDays: integer("used_days").notNull().default(0),
    remainingDays: integer("remaining_days").notNull().default(0),
    year: integer("year").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("leave_balances_employee_idx").on(table.employeeId),
    index("leave_balances_type_year_idx").on(table.leaveType, table.year),
  ],
);

export const employeeRelations = relations(employees, ({ one, many }) => ({
  manager: one(employees, {
    fields: [employees.managerId],
    references: [employees.id],
  }),

  tasksAssigned: many(tasks, {
    relationName: "assignedTo",
  }),

  tasksCreated: many(tasks, {
    relationName: "assignedBy",
  }),

  taskSubmissions: many(taskSubmissions),

  taskReviewsGiven: many(taskReviews),

  leaveApplications: many(leaveApplications),
  leaveBalances: many(leaveBalances),
  approvedLeaves: many(leaveApplications, {
    relationName: "approvedBy",
  }),
}));

export const leaveApplicationRelations = relations(
  leaveApplications,
  ({ one }) => ({
    employee: one(employees, {
      fields: [leaveApplications.employeeId],
      references: [employees.id],
    }),
    approver: one(employees, {
      fields: [leaveApplications.approvedBy],
      references: [employees.id],
      relationName: "approvedBy",
    }),
  }),
);

export const leaveBalanceRelations = relations(leaveBalances, ({ one }) => ({
  employee: one(employees, {
    fields: [leaveBalances.employeeId],
    references: [employees.id],
  }),
}));
