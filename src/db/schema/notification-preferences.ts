import { pgTable, uuid, boolean, serial } from "drizzle-orm/pg-core";
import { employees } from "./hr";

export const notification_preferences = pgTable("notification_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: serial("user_id")
    .references(() => employees.id)
    .notNull(),

  // Preferences
  email_notifications: boolean("email_notifications").default(true).notNull(),
  //   push_notifications: boolean("push_notifications").default(true).notNull(),
  in_app_notifications: boolean("in_app_notifications").default(true).notNull(),
  notify_on_message: boolean("notify_on_message").default(true).notNull(),
});
