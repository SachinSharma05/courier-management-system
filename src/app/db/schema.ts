import { sql } from "drizzle-orm";
import { pgTable, serial, text, varchar, timestamp, uuid, date, time, integer, boolean, numeric, json, unique, jsonb } from "drizzle-orm/pg-core";

// CONSIGNMENTS
export const consignments = pgTable("consignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  awb: varchar("awb", { length: 20 }).notNull().unique(),
  lastStatus: text("last_status"),
  origin: text("origin"),
  destination: text("destination"),
  bookedOn: date("booked_on"),
  lastUpdatedOn: timestamp("last_updated_on"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  providers: json("providers").$type<string[]>().default([]),
  client_id: integer("client_id").notNull(), // FK users.id
});

// TRACKING EVENTS
export const trackingEvents = pgTable("tracking_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  consignmentId: uuid("consignment_id").notNull().references(() => consignments.id, { onDelete: "cascade" }),
  action: text("action"),
  actionDate: date("action_date"),
  actionTime: time("action_time"),
  origin: text("origin"),
  destination: text("destination"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
});

// TRACKING HISTORY LOG
export const trackingHistory = pgTable("tracking_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  consignmentId: uuid("consignment_id").references(() => consignments.id),
  oldStatus: text("old_status"),
  newStatus: text("new_status"),
  changedAt: timestamp("changed_at").defaultNow(),
});

export const clientCredentials = pgTable(
  "client_credentials",
  {
    id: serial("id").primaryKey(),
    client_id: integer("client_id").notNull(),
    provider_id: integer("provider_id").notNull(),
    env_key: varchar("env_key", { length: 100 }).notNull(),
    encrypted_value: text("encrypted_value").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    uniq: unique("unique_credential_entry")
      .on(table.client_id, table.provider_id, table.env_key),
  })
);

// weight slabs
export const courierWeightSlabs = pgTable("courier_weight_slabs", {
  id: serial("id").primaryKey(),
  client_id: integer("client_id").notNull(), // 0 = global default
  min_weight: numeric("min_weight").notNull(),
  max_weight: numeric("max_weight").notNull(),
  price: numeric("price").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// service types (STANDARD / PRIORITY etc.)
export const courierServices = pgTable("courier_services", {
  id: serial("id").primaryKey(),
  client_id: integer("client_id").notNull(), // 0 = global default
  code: text("code").notNull(), // STANDARD, PRIORITY
  base_price: numeric("base_price").notNull(),
  priority_multiplier: numeric("priority_multiplier").notNull().default("1"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// distance slabs in KM
export const courierDistanceSlabs = pgTable("courier_distance_slabs", {
  id: serial("id").primaryKey(),
  client_id: integer("client_id").notNull(),
  min_km: integer("min_km").notNull(),
  max_km: integer("max_km").notNull(),
  price: integer("price").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// surcharges
export const courierSurcharges = pgTable("courier_surcharges", {
  id: serial("id").primaryKey(),
  client_id: integer("client_id").notNull(),
  load_type: text("load_type").notNull(), // NON-DOCUMENT
  price: integer("price").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const providers = pgTable("providers", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 50 }).notNull().unique(), // "dtdc", "delhivery"
  name: varchar("name", { length: 150 }).notNull(),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 150 }).notNull().unique(),
  email: varchar("email", { length: 254 }).notNull().unique(),
  password_hash: text("password_hash").notNull(),
  role: text("role").notNull().default("client"), // client | super_admin
  company_name: text("company_name"),
  company_address: text("company_address"),
  contact_person: text("contact_person"),
  phone: text("phone"),
  providers: json("providers").$type<string[]>().default([]),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// db/schema/billing.ts
export const invoices = pgTable("invoices", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(), // requires pgcrypto or pgcrypto extension / gen_random_uuid
  client_id: integer("client_id").notNull(),
  month: varchar("month", { length: 20 }).default(sql`TO_CHAR(NOW(), 'YYYY-MM')`), // e.g., '2024-11'
  total_amount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  paid_amount: numeric("paid_amount", { precision: 12, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("unpaid"), // paid | unpaid | partial
  note: text("note"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const invoice_items = pgTable("invoice_items", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  invoice_id: uuid("invoice_id").notNull(),
  awb: varchar("awb", { length: 128 }).notNull(),
  charge: numeric("charge", { precision: 12, scale: 2 }).notNull(),
  weight: numeric("weight", { precision: 8, scale: 2 }),
  zone: varchar("zone", { length: 50 }).default(""),
  provider: varchar("provider", { length: 50 }).default(""),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  invoice_id: uuid("invoice_id").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  method: varchar("method", { length: 50 }).default("manual"),
  reference: varchar("reference", { length: 255 }).default(""),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const complaints = pgTable("complaints", {
  id: serial("id").primaryKey(),
  client_id: integer("client_id").notNull(),   // FK → users.id
  awb: varchar("awb", { length: 50 }).notNull(),
  message: text("message").notNull(),
  status: varchar("status", { length: 20 }).default("open").notNull(), 
  // status → open | in_progress | resolved
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const delhiveryShipments = pgTable("delhivery_shipments", {
  // Primary
  id: varchar("id", { length: 40 }).primaryKey().$defaultFn(() => crypto.randomUUID()),

  // LRN (LR Number returned after successful manifest)
  lr_number: varchar("lr_number", { length: 40 }),

  // Order (client order id if any)
  order_id: varchar("order_id", { length: 100 }),

  // Delhivery metadata
  manifest_job_id: varchar("manifest_job_id", { length: 100 }),
  pickup_location_name: varchar("pickup_location_name", { length: 200 }),

  // Consignee
  consignee_name: varchar("consignee_name", { length: 200 }),
  consignee_address: text("consignee_address"),
  consignee_city: varchar("consignee_city", { length: 100 }),
  consignee_state: varchar("consignee_state", { length: 100 }),
  consignee_pincode: varchar("consignee_pincode", { length: 10 }),
  consignee_phone: varchar("consignee_phone", { length: 20 }),

  // Billing address metadata
  billing_address: jsonb("billing_address"),

  // Shipment Details
  box_count: integer("box_count"),
  total_weight_g: integer("total_weight_g"), // Delhivery uses grams
  dimensions: jsonb("dimensions"),          // array of L/W/H/box_count
  shipment_details: jsonb("shipment_details"), // array from manifest

  // Invoices (array of multiple invoices)
  invoices: jsonb("invoices"),

  // Payment / Mode
  payment_mode: varchar("payment_mode", { length: 20 }), // cod/fop/prepaid
  cod_amount: integer("cod_amount"),
  freight_mode: varchar("freight_mode", { length: 20 }), // fop, fod etc.
  rov_insurance: boolean("rov_insurance"),

  // Dropoff location JSON object
  dropoff_location: jsonb("dropoff_location"),

  // Document metadata
  documents_meta: jsonb("documents_meta"),
  doc_files: jsonb("doc_files"),

  // Status (updated via Track LR API)
  current_status: varchar("current_status", { length: 50 }),
  status_updated_at: timestamp("status_updated_at"),

  // Raw tracking response (for debugging)
  tracking_response: jsonb("tracking_response"),

  // Label / POD URLs
  label_url: text("label_url"),
  pod_url: text("pod_url"),

  // Timestamps
  created_at: timestamp("created_at").default(sql`NOW()`),
  updated_at: timestamp("updated_at").default(sql`NOW()`),
});

export const delhiveryC2CShipments = pgTable("delhivery_c2c_shipments", {
  id: varchar("id", { length: 40 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  awb: varchar("awb", { length: 50 }).notNull().unique(),

  order_id: varchar("order_id", { length: 100 }),
  channel: varchar("channel", { length: 100 }),

  facility_name: varchar("facility_name", { length: 200 }),
  pickup_address: jsonb("pickup_address"),

  customer_name: varchar("customer_name", { length: 200 }),
  customer_address: text("customer_address"),                 // must be nullable
  customer_phone: varchar("customer_phone", { length: 20 }),  // must be nullable
  customer_email: varchar("customer_email", { length: 100 }),
  customer_pincode: varchar("customer_pincode", { length: 10 }),

  service_type: varchar("service_type", { length: 20 }),      // must be nullable
  payment_mode: varchar("payment_mode", { length: 20 }),      // must be nullable
  cod_amount: integer("cod_amount"),

  length_cm: integer("length_cm"),
  breadth_cm: integer("breadth_cm"),
  height_cm: integer("height_cm"),
  weight_g: integer("weight_g"),
  chargeable_weight_g: integer("chargeable_weight_g"),

  estimated_cost: integer("estimated_cost"),
  cost_breakup: jsonb("cost_breakup"),

  label_url: text("label_url"),

  current_status: varchar("current_status", { length: 100 }),
  latest_status_time: timestamp("latest_status_time"),
  last_synced_at: timestamp("last_synced_at"),

  origin: varchar("origin", { length: 200 }),
  destination: varchar("destination", { length: 200 }),
  expected_delivery_date: timestamp("expected_delivery_date"),
  invoice_amount: integer("invoice_amount"),

  tracking_response: jsonb("tracking_response"),

  raw_request: jsonb("raw_request"),
  raw_response: jsonb("raw_response"),

  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const delhiveryC2CEvents = pgTable("delhivery_c2c_events", {
  id: varchar("id", { length: 40 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  awb: varchar("awb", { length: 50 }).notNull(),

  scan: varchar("scan", { length: 200 }),          // e.g., "In Transit"
  scan_type: varchar("scan_type", { length: 50 }), // e.g., "UD"
  status_code: varchar("status_code", { length: 50 }),
  location: varchar("location", { length: 200 }),
  instructions: text("instructions"),
  event_time: timestamp("event_time"),

  raw: jsonb("raw"),
  created_at: timestamp("created_at").defaultNow(),
});