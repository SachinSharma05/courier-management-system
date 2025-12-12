CREATE TABLE "delhivery_c2c_events" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"awb" varchar(50) NOT NULL,
	"status" varchar(200),
	"description" text,
	"location" varchar(200),
	"event_time" timestamp,
	"raw" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "delhivery_c2c_shipments" ADD COLUMN "latest_status_time" timestamp;--> statement-breakpoint
ALTER TABLE "delhivery_c2c_shipments" ADD COLUMN "last_synced_at" timestamp;