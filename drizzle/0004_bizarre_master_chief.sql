CREATE TABLE "provider_shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consignment_id" uuid NOT NULL,
	"provider" varchar(30) NOT NULL,
	"provider_order_id" varchar(100),
	"provider_tracking_id" varchar(100),
	"provider_awb" varchar(50),
	"provider_cawb" varchar(50),
	"label_url" text,
	"manifest_url" text,
	"pod_url" text,
	"raw_request" jsonb,
	"raw_response" jsonb,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "delhivery_c2c_events" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "delhivery_c2c_shipments" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "delhivery_shipments" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "delhivery_c2c_events" CASCADE;--> statement-breakpoint
DROP TABLE "delhivery_c2c_shipments" CASCADE;--> statement-breakpoint
DROP TABLE "delhivery_shipments" CASCADE;--> statement-breakpoint
ALTER TABLE "tracking_history" DROP CONSTRAINT "tracking_history_consignment_id_consignments_id_fk";
--> statement-breakpoint
ALTER TABLE "consignments" ALTER COLUMN "awb" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "consignments" ADD COLUMN "provider" varchar(30) NOT NULL;--> statement-breakpoint
ALTER TABLE "consignments" ADD COLUMN "reference_number" varchar(100);--> statement-breakpoint
ALTER TABLE "consignments" ADD COLUMN "service_type" varchar(30);--> statement-breakpoint
ALTER TABLE "consignments" ADD COLUMN "payment_mode" varchar(20);--> statement-breakpoint
ALTER TABLE "consignments" ADD COLUMN "cod_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "consignments" ADD COLUMN "origin_pincode" varchar(10);--> statement-breakpoint
ALTER TABLE "consignments" ADD COLUMN "destination_pincode" varchar(10);--> statement-breakpoint
ALTER TABLE "consignments" ADD COLUMN "length_cm" integer;--> statement-breakpoint
ALTER TABLE "consignments" ADD COLUMN "breadth_cm" integer;--> statement-breakpoint
ALTER TABLE "consignments" ADD COLUMN "height_cm" integer;--> statement-breakpoint
ALTER TABLE "consignments" ADD COLUMN "weight_g" integer;--> statement-breakpoint
ALTER TABLE "consignments" ADD COLUMN "chargeable_weight_g" integer;--> statement-breakpoint
ALTER TABLE "consignments" ADD COLUMN "estimated_cost" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "consignments" ADD COLUMN "invoice_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "consignments" ADD COLUMN "current_status" varchar(100);--> statement-breakpoint
ALTER TABLE "consignments" ADD COLUMN "expected_delivery_date" timestamp;--> statement-breakpoint
ALTER TABLE "consignments" ADD COLUMN "booked_at" timestamp;--> statement-breakpoint
ALTER TABLE "consignments" ADD COLUMN "last_status_at" timestamp;--> statement-breakpoint
ALTER TABLE "tracking_events" ADD COLUMN "provider" varchar(30) NOT NULL;--> statement-breakpoint
ALTER TABLE "tracking_events" ADD COLUMN "awb" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "tracking_events" ADD COLUMN "status" varchar(100);--> statement-breakpoint
ALTER TABLE "tracking_events" ADD COLUMN "location" varchar(200);--> statement-breakpoint
ALTER TABLE "tracking_events" ADD COLUMN "event_time" timestamp;--> statement-breakpoint
ALTER TABLE "tracking_events" ADD COLUMN "raw" jsonb;--> statement-breakpoint
ALTER TABLE "provider_shipments" ADD CONSTRAINT "provider_shipments_consignment_id_consignments_id_fk" FOREIGN KEY ("consignment_id") REFERENCES "public"."consignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consignments" DROP COLUMN "last_status";--> statement-breakpoint
ALTER TABLE "consignments" DROP COLUMN "booked_on";--> statement-breakpoint
ALTER TABLE "consignments" DROP COLUMN "last_updated_on";--> statement-breakpoint
ALTER TABLE "consignments" DROP COLUMN "providers";--> statement-breakpoint
ALTER TABLE "tracking_events" DROP COLUMN "action";--> statement-breakpoint
ALTER TABLE "tracking_events" DROP COLUMN "action_date";--> statement-breakpoint
ALTER TABLE "tracking_events" DROP COLUMN "action_time";--> statement-breakpoint
ALTER TABLE "tracking_events" DROP COLUMN "origin";--> statement-breakpoint
ALTER TABLE "tracking_events" DROP COLUMN "destination";