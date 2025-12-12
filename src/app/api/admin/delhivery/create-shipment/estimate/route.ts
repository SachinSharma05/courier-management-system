import { dlvC2C } from "@/app/lib/delhivery/delhivery.c2c";

export async function POST(req: Request) {
  try {
    const { customer_pincode, weight_kg, service_type, payment_mode } =
      await req.json();

    const weight_g = Math.round(weight_kg * 1000);

    const result = await dlvC2C.calculateCost({
      o_pin: "452010",        // pickup origin (your warehouse)
      d_pin: customer_pincode,
      cgm: weight_g,
      md: service_type === "express" ? "E" : "S",
      pt: payment_mode === "cod" ? "COD" : "Pre-paid",
    });

    return Response.json(result);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}