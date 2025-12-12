ALTER TABLE "delhivery_c2c_shipments" ALTER COLUMN "order_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "delhivery_c2c_shipments" ALTER COLUMN "customer_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "delhivery_c2c_shipments" ALTER COLUMN "customer_address" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "delhivery_c2c_shipments" ALTER COLUMN "customer_phone" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "delhivery_c2c_shipments" ALTER COLUMN "customer_pincode" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "delhivery_c2c_shipments" ALTER COLUMN "service_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "delhivery_c2c_shipments" ALTER COLUMN "payment_mode" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "delhivery_c2c_shipments" ALTER COLUMN "cod_amount" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "delhivery_c2c_shipments" ALTER COLUMN "awb" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "delhivery_c2c_shipments" ALTER COLUMN "awb" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "delhivery_c2c_shipments" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "delhivery_c2c_shipments" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "delhivery_c2c_events" ADD COLUMN "scan" varchar(200);--> statement-breakpoint
ALTER TABLE "delhivery_c2c_events" ADD COLUMN "scan_type" varchar(50);--> statement-breakpoint
ALTER TABLE "delhivery_c2c_events" ADD COLUMN "status_code" varchar(50);--> statement-breakpoint
ALTER TABLE "delhivery_c2c_events" ADD COLUMN "instructions" text;--> statement-breakpoint
ALTER TABLE "delhivery_c2c_shipments" ADD COLUMN "origin" varchar(200);--> statement-breakpoint
ALTER TABLE "delhivery_c2c_shipments" ADD COLUMN "destination" varchar(200);--> statement-breakpoint
ALTER TABLE "delhivery_c2c_shipments" ADD COLUMN "expected_delivery_date" timestamp;--> statement-breakpoint
ALTER TABLE "delhivery_c2c_shipments" ADD COLUMN "invoice_amount" integer;--> statement-breakpoint
ALTER TABLE "delhivery_c2c_events" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "delhivery_c2c_events" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "delhivery_c2c_shipments" ADD CONSTRAINT "delhivery_c2c_shipments_awb_unique" UNIQUE("awb");