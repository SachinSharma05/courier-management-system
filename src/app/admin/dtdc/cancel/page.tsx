import { Card } from "@/components/ui/card";
import CancelShipmentForm from "@/components/admin/CancelShipmentForm";

export default function CancelPage({
  params,
}: {
  params: { id: string };
}) {
  const clientId = Number(params.id);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">DTDC — Cancel Shipment</h1>
      <Card className="p-6">
        <CancelShipmentForm clientId={clientId} />
      </Card>
    </div>
  );
}
