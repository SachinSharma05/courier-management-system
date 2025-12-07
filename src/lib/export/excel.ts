import * as XLSX from "xlsx";

export function exportConsignmentsToExcel(
  rows: any[],
  filename = "tracking-export"
) {
  if (!rows.length) throw new Error("No data to export");

  const data = [
    ["AWB", "Status", "Booked", "Last Update", "Origin", "Destination"],
    ...rows.map((r) => [
      r.awb,
      r.last_status ?? "",
      r.booked_on ?? "",
      r.last_updated_on ?? "",
      r.origin ?? "",
      r.destination ?? "",
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tracking");

  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });

  const blob = new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/[:T]/g, "-")}.xlsx`;

  a.click();
  URL.revokeObjectURL(url);
}