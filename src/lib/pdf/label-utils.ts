import { mergePDFs } from "@/app/lib/pdf/mergePDFs";
import { generateCustomLabel } from "@/app/lib/pdf/generateCustomLabel";

export async function downloadMergedLabelForRow(row: any) {
  const awb = row.awb;

  // 1. Fetch DTDC label
  const res = await fetch("/api/dtdc/label", {
    method: "POST",
    body: JSON.stringify({ awb }),
  });

  const json = await res.json();
  if (!json?.data?.[0]?.label) throw new Error("DTDC label missing");

  const dtdcBase64 = json.data[0].label;

  // 2. Generate custom label
  const customPdf = await generateCustomLabel({
    awb,
    company: "VIS Pvt Ltd",
    address: "Indore, Madhya Pradesh",
    phone: "+91 9340384339",
  });

  // 3. Merge into single PDF
  const merged = await mergePDFs(
    new Uint8Array(customPdf),
    new Uint8Array(dtdcBase64)
  );

  const blob = new Blob([new Uint8Array(merged)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `LABEL_${awb}.pdf`;
  a.click();

  URL.revokeObjectURL(url);
}
