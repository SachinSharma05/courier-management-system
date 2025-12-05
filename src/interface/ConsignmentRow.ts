export interface ConsignmentRow {
  awb: string;
  last_status?: string | null;
  origin?: string | null;
  destination?: string | null;
  booked_on?: string | null;
  last_updated_on?: string | null;
  last_action?: string | null;
  timeline?: any[];
  tat?: string;
  movement?: string;
};