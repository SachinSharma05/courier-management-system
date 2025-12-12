import { NextResponse } from "next/server";
import { dlvC2C } from "@/app/lib/delhivery/delhivery.c2c";

export async function POST(req: Request) {
  try {
    const { awb } = await req.json();

    if (!awb) {
      return NextResponse.json({ error: "AWB required" }, { status: 400 });
    }

    const result = await dlvC2C.generateLabel(awb);

    console.log("LABEL RESULT RAW:", result);

    const pkg = result?.packages?.[0];

    if (!pkg) {
      return NextResponse.json({
        error: "Invalid Delhivery response",
        response: result
      });
    }

    const pdfUrl = pkg.pdf_download_link;
    const pdfBase64 = pkg.pdf_encoding;

    if (!pdfUrl && !pdfBase64) {
      return NextResponse.json({
        error: "Label not available for this AWB",
        response: result
      });
    }

    return NextResponse.json({
      link: pdfUrl || null,
      base64: pdfBase64 || null,
      wbn: pkg.wbn
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: err?.response ?? err?.message },
      { status: 500 }
    );
  }
}
