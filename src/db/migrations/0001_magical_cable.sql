CREATE TYPE "public"."employment_type" AS ENUM('Full-time', 'Part-time', 'Contract', 'Intern');--> statement-breakpoint
CREATE TYPE "public"."marital_status" AS ENUM('Single', 'Married', 'Divorced', 'Widowed');--> statement-breakpoint
CREATE TABLE "employees" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"auth_id" text DEFAULT '' NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"staff_number" text NOT NULL,
	"role" text NOT NULL,
	"is_manager" boolean DEFAULT false NOT NULL,
	"department" text,
	"manager_id" integer,
	"date_of_birth" date,
	"address" text,
	"marital_status" "marital_status",
	"employment_type" "employment_type",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "employees_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "email" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" integer NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"parent_email_id" integer,
	"type" text DEFAULT 'sent' NOT NULL,
	"has_been_opened" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_recipient" (
	"id" serial PRIMARY KEY NOT NULL,
	"email_id" integer NOT NULL,
	"recipient_id" integer NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"archived_at" timestamp,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email" ADD CONSTRAINT "email_sender_id_employees_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_recipient" ADD CONSTRAINT "email_recipient_email_id_email_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."email"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_recipient" ADD CONSTRAINT "email_recipient_recipient_id_employees_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "employee_manager_idx" ON "employees" USING btree ("manager_id");--> statement-breakpoint
CREATE INDEX "employees_department_role_idx" ON "employees" USING btree ("department","role");--> statement-breakpoint
CREATE INDEX "email_sender_id_idx" ON "email" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "email_created_at_idx" ON "email" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "email_parent_email_id_idx" ON "email" USING btree ("parent_email_id");--> statement-breakpoint
CREATE INDEX "email_recipient_email_id_idx" ON "email_recipient" USING btree ("email_id");--> statement-breakpoint
CREATE INDEX "email_recipient_recipient_id_idx" ON "email_recipient" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "email_recipient_is_read_idx" ON "email_recipient" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "email_recipient_is_archived_idx" ON "email_recipient" USING btree ("is_archived");--> statement-breakpoint
CREATE INDEX "email_recipient_is_deleted_idx" ON "email_recipient" USING btree ("is_deleted");--> statement-breakpoint
CREATE INDEX "auth_accounts_userId" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_userId" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_token" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "auth_users_email" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "auth_verification_identifier" ON "verification" USING btree ("identifier");