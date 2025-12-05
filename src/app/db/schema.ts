import { sql } from "drizzle-orm";
import { pgTable, serial, text, varchar, timestamp, uuid, date, time, integer, boolean, numeric, json, unique } from "drizzle-orm/pg-core";

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

export const clientProviders = pgTable("client_providers", {
  id: serial("id").primaryKey(),
  client_id: integer("client_id").notNull(),
  provider_id: integer("provider_id").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

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