-- Fix attendance table: convert time columns to timestamp
-- This migration converts sign_in_time and sign_out_time from time to timestamp
-- by combining them with the date column

ALTER TABLE "attendance" 
ALTER COLUMN "sign_in_time" TYPE timestamp without time zone 
USING CASE 
  WHEN "sign_in_time" IS NOT NULL AND "date" IS NOT NULL 
  THEN ("date" + "sign_in_time")::timestamp without time zone
  ELSE NULL
END;

ALTER TABLE "attendance" 
ALTER COLUMN "sign_out_time" TYPE timestamp without time zone 
USING CASE 
  WHEN "sign_out_time" IS NOT NULL AND "date" IS NOT NULL 
  THEN ("date" + "sign_out_time")::timestamp without time zone
  ELSE NULL
END;

