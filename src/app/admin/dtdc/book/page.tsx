import { Card } from "@/components/ui/card";
import BookShipmentForm from "@/components/admin/BookShipmentForm";

export default function BookPage({
  params,
}: {
  params: { id: string };
}) {
  const clientId = Number(params.id);
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">DTDC — Single Booking</h1>
      <Card className="p-6">
        <BookShipmentForm clientId={Number(clientId)} />
      </Card>
    </div>
  );
}