// src/interface/delhivery.ts
export interface DelhiveryCreateShipment {
  awb?: string;
  client_ref?: string;
  order: {
    name: string;
    phone: string;
    address: string;
    pincode: string;
    city?: string;
    state?: string;
  };
  items: Array<{ name: string; qty: number; price?: number; weight?: number }>;
  // add fields you need
}

// src/interface/delhivery.ts
export type ShipmentStatus = "pending" | "in_transit" | "delivered" | "rto" | "cancelled" | string;

export interface DelhiveryItem {
  name: string;
  qty: number;
  weight?: number; // per item (kg)
  price?: number;
  hsnsac?: string;
}

export interface CreateShipmentPayload {
  awb?: string;
  client_ref?: string;
  pickup_location?: string; // warehouse id
  service_type?: string;
  cod_amount?: number;
  order: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    pincode: string;
    city?: string;
    state?: string;
  };
  items: DelhiveryItem[];
  total_weight?: number;
  dimensions?: { length?: number; breadth?: number; height?: number };
  additional?: Record<string, any>;
}

export interface Consignment {
  id: string;
  awb: string;
  client_ref?: string;
  order: {
    name: string;
    phone: string;
    address: string;
    pincode: string;
  };
  status: ShipmentStatus;
  created_at: string;
  updated_at?: string;
  charges?: number;
  meta?: Record<string, any>;
}