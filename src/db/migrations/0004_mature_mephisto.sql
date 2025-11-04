ALTER TABLE "notifications" DROP CONSTRAINT "notifications_sender_id_employees_id_fk";
--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "created_by" serial NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_created_by_employees_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN "sender_id";