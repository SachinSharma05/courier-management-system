import BulkBookingPage from "@/components/admin/BulkBookShipmentForm";
import { Card } from "@/components/ui/card";

export default function BulkBookPage({
  params,
}: {
  params: { id: string };
}) {
  const clientId = Number(params.id);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">DTDC — Bulk Booking</h1>
      <Card className="p-6">
        <BulkBookingPage clientId={Number(clientId)} />
      </Card>
    </div>
  );
}