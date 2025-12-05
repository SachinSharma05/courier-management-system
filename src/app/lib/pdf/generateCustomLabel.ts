// lib/pdf/generateCustomLabel.ts
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/**
 * Generate a simple one-page PDF label with company & AWB info.
 * Returns Uint8Array (PDF bytes).
 */
export async function generateCustomLabel(opts: {
  awb: string;
  company?: string;
  address?: string;
  phone?: string;
  sender?: { name?: string; phone?: string; pincode?: string } | null;
  receiver?: { name?: string; phone?: string; pincode?: string } | null;
}) {
  const { awb, company, address, phone, sender, receiver } = opts;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 420]); // A6-ish label (landscape)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { height } = page.getSize();

  const margin = 18;

  // Header: Company
  page.drawText(company ?? "Company Name", {
    x: margin,
    y: height - margin - 14,
    size: 14,
    font: fontBold,
    color: rgb(0.07, 0.07, 0.07),
  });

  // AWB big
  page.drawText(`AWB: ${awb}`, {
    x: margin,
    y: height - margin - 40,
    size: 18,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Address and phone
  page.drawText(address ?? "Address not provided", {
    x: margin,
    y: height - margin - 64,
    size: 9,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });

  page.drawText(`Phone: ${phone ?? "NA"}`, {
    x: margin,
    y: height - margin - 80,
    size: 9,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });

  // Sender and Receiver boxes
  const boxY = height - margin - 120;
  page.drawText("From:", { x: margin, y: boxY, size: 10, font: fontBold });
  page.drawText(sender?.name ?? "-", { x: margin, y: boxY - 16, size: 9, font });
  page.drawText(sender?.phone ?? "-", { x: margin, y: boxY - 30, size: 9, font });
  page.drawText(`PIN: ${sender?.pincode ?? "-"}`, { x: margin, y: boxY - 44, size: 9, font });

  page.drawText("To:", { x: margin + 250, y: boxY, size: 10, font: fontBold });
  page.drawText(receiver?.name ?? "-", { x: margin + 250, y: boxY - 16, size: 9, font });
  page.drawText(receiver?.phone ?? "-", { x: margin + 250, y: boxY - 30, size: 9, font });
  page.drawText(`PIN: ${receiver?.pincode ?? "-"}`, { x: margin + 250, y: boxY - 44, size: 9, font });

  // small footer
  page.drawText(`Generated: ${new Date().toLocaleString()}`, {
    x: margin,
    y: margin,
    size: 7,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  const bytes = await pdfDoc.save();
  return bytes; // Uint8Array
}