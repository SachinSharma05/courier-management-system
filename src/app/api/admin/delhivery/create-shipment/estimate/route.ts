import { dlvC2C } from "@/app/lib/delhivery/delhivery.c2c";

export async function POST(req: Request) {
  try {
    const {
      customer_pincode,
      weight_kg,
      service_type,
      payment_mode,
      cod_amount, // ✅ ADD THIS
    } = await req.json();

    const weight_g = Math.round(weight_kg * 1000);

    const result = await dlvC2C.calculateCost({
      o_pin: "452010", // pickup origin
      d_pin: customer_pincode,
      cgm: weight_g,
      md: service_type === "express" ? "E" : "S",
      pt: payment_mode === "cod" ? "COD" : "Pre-paid",
      cod_amount: payment_mode === "cod" ? Number(cod_amount || 0) : undefined,

      // 🔥 REQUIRED BY DELHIVERY C2C
      client_code: "VARIABLEINSTINCT C2C",
      ss: "Delivered", // 🔥 mandatory
    });

    return Response.json({ success: true, result });
  } catch (err: any) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}