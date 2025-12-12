import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { rows } = await req.json();
  const results: any[] = [];

  for (const row of rows) {
    const payload = {
      order_id: `VI-${Date.now()}-${Math.floor(Math.random() * 999)}`,

      customer_name: row.customer_name,
      customer_phone: row.customer_phone,
      customer_address: row.customer_address,
      customer_pincode: row.customer_pincode,

      length_cm: Number(row.length_cm),
      breadth_cm: Number(row.breadth_cm),
      height_cm: Number(row.height_cm),
      weight_kg: Number(row.weight_kg),

      payment_mode: row.payment_mode,
      cod_amount: row.cod_amount || 0,

      service_type: row.service_type || "surface",
    };

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/delhivery/create-shipment`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json();
      results.push({
        ...json,
        order_id: payload.order_id,
      });
    } catch (err: any) {
      results.push({
        success: false,
        order_id: payload.order_id,
        error: err.message,
      });
    }
  }

  return NextResponse.json({ results });
}