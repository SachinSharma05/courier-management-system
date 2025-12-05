// lib/pdf/mergePDFs.ts
import { PDFDocument } from "pdf-lib";

/**
 * Merge multiple PDFs (Uint8Array or ArrayBuffer) into a single PDF.
 * Returns Uint8Array of merged PDF bytes.
 */
export async function mergePDFs(...pdfBytesList: (Uint8Array | ArrayBuffer | string)[]) {
  const merged = await PDFDocument.create();

  for (const item of pdfBytesList) {
    // Accept base64 string as well (if user passes base64)
    let bytes: Uint8Array;
    if (typeof item === "string") {
      // treat as base64 (strip data:pdf prefix if present)
      const b64 = item.replace(/^data:application\/pdf;base64,/, "");
      const binaryString = atob(b64);
      const len = binaryString.length;
      const arr = new Uint8Array(len);
      for (let i = 0; i < len; i++) arr[i] = binaryString.charCodeAt(i);
      bytes = arr;
    } else if (item instanceof ArrayBuffer) {
      bytes = new Uint8Array(item);
    } else {
      bytes = item;
    }

    const donor = await PDFDocument.load(bytes);
    const donorPages = await merged.copyPages(donor, donor.getPageIndices());
    donorPages.forEach((p) => merged.addPage(p));
  }

  const mergedBytes = await merged.save();
  return mergedBytes; // Uint8Array
}