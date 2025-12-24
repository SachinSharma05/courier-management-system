ALTER TABLE "tracking_history" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "tracking_history" CASCADE;--> statement-breakpoint
CREATE INDEX "consignments_client_id_idx" ON "consignments" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "consignments_client_provider_idx" ON "consignments" USING btree ("client_id","provider");--> statement-breakpoint
CREATE INDEX "consignments_status_idx" ON "consignments" USING btree ("current_status");--> statement-breakpoint
CREATE INDEX "consignments_created_at_idx" ON "consignments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "consignments_provider_idx" ON "consignments" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "provider_shipments_consignment_idx" ON "provider_shipments" USING btree ("consignment_id");--> statement-breakpoint
CREATE INDEX "provider_shipments_provider_idx" ON "provider_shipments" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "provider_shipments_last_synced_idx" ON "provider_shipments" USING btree ("last_synced_at");--> statement-breakpoint
CREATE INDEX "provider_shipments_provider_awb_idx" ON "provider_shipments" USING btree ("provider_awb");--> statement-breakpoint
CREATE INDEX "tracking_events_consignment_time_idx" ON "tracking_events" USING btree ("consignment_id","event_time");--> statement-breakpoint
CREATE INDEX "tracking_events_awb_idx" ON "tracking_events" USING btree ("awb");--> statement-breakpoint
CREATE INDEX "tracking_events_provider_idx" ON "tracking_events" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "tracking_events_created_at_idx" ON "tracking_events" USING btree ("created_at");