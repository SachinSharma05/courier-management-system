import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  const sample = [
    {
      customer_name: "John Doe",
      customer_phone: "9876543210",
      customer_address: "Street 1, City",
      customer_pincode: "452010",
      length_cm: 10,
      breadth_cm: 15,
      height_cm: 20,
      weight_kg: 0.5,
      payment_mode: "prepaid",
      cod_amount: "",
      service_type: "surface",
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sample);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sample");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=delhivery_bulk_sample.xlsx",
    },
  });
}