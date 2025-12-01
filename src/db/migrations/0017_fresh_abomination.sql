CREATE TABLE "attendance_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"sign_in_start_hour" integer DEFAULT 6 NOT NULL,
	"sign_in_end_hour" integer DEFAULT 9 NOT NULL,
	"sign_out_start_hour" integer DEFAULT 14 NOT NULL,
	"sign_out_end_hour" integer DEFAULT 20 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attendance" ADD COLUMN "sign_in_latitude" numeric(10, 8);--> statement-breakpoint
ALTER TABLE "attendance" ADD COLUMN "sign_in_longitude" numeric(11, 8);--> statement-breakpoint
ALTER TABLE "attendance" ADD COLUMN "sign_in_location" text;