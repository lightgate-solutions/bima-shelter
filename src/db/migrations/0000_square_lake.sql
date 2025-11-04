CREATE TYPE "public"."employment_type" AS ENUM('Full-time', 'Part-time', 'Contract', 'Intern');--> statement-breakpoint
CREATE TYPE "public"."marital_status" AS ENUM('Single', 'Married', 'Divorced', 'Widowed');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('approval', 'deadline', 'message');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	"username" text,
	"display_username" text,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"notification_type" "notification_type" NOT NULL,
	"reference_id" uuid NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email" ADD CONSTRAINT "email_sender_id_employees_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_recipient" ADD CONSTRAINT "email_recipient_email_id_email_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."email"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_recipient" ADD CONSTRAINT "email_recipient_recipient_id_employees_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_reference_id_email_id_fk" FOREIGN KEY ("reference_id") REFERENCES "public"."email"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_accounts_userId" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_userId" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_token" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "auth_users_email" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "auth_verification_identifier" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "employee_manager_idx" ON "employees" USING btree ("manager_id");--> statement-breakpoint
CREATE INDEX "employees_department_role_idx" ON "employees" USING btree ("department","role");--> statement-breakpoint
CREATE INDEX "email_sender_id_idx" ON "email" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "email_created_at_idx" ON "email" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "email_parent_email_id_idx" ON "email" USING btree ("parent_email_id");--> statement-breakpoint
CREATE INDEX "email_recipient_email_id_idx" ON "email_recipient" USING btree ("email_id");--> statement-breakpoint
CREATE INDEX "email_recipient_recipient_id_idx" ON "email_recipient" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "email_recipient_is_read_idx" ON "email_recipient" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "email_recipient_is_archived_idx" ON "email_recipient" USING btree ("is_archived");--> statement-breakpoint
CREATE INDEX "email_recipient_is_deleted_idx" ON "email_recipient" USING btree ("is_deleted");