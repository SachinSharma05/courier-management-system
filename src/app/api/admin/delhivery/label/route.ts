import { NextResponse } from "next/server";
import { generateLabel } from "@/app/lib/delhivery/delhivery";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const result = await generateLabel(payload);

    // If label is base64 PDF from Delhivery
    if (result?.pdf) {
      return NextResponse.json({
        base64: result.pdf,
        filename: `${payload?.awb || "label"}.pdf`,
      });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Label download failed:", err);
    return NextResponse.json(
      { error: err?.response ?? err?.message },
      { status: err?.status ?? 500 }
    );
  }
}
