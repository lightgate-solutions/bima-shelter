CREATE TYPE "public"."project_status" AS ENUM('pending', 'in-progress', 'completed');--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "status" "project_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "project_status";