"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ClientDetailPage({ id }: { id: string }) {
  const [client, setClient] = useState<any>(null);

  // Pending consignments
  const [pendingConsignments, setPendingConsignments] = useState<any[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);

  const [tab, setTab] = useState<"track" | "book" | "bulk" | "cancel">("track");

  // Load client info + pending consignments
  useEffect(() => {
    async function load() {
      setLoadingPending(true);

      const res = await fetch(`/api/admin/clients/${id}`);
      const json = await res.json();

      setClient(json.client);
      setPendingConsignments(json.pendingConsignments || []);

      setLoadingPending(false);
    }

    load();
  }, [id]);

  if (!client) return <div className="p-6">Loading client...</div>;

  return (
    <div className="space-y-8 p-6">

      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{client.company_name}</h1>
          <p className="text-gray-600 text-sm">{client.email}</p>
        </div>

        <div className="text-sm text-gray-500">
          Client ID: <span className="font-semibold">#{client.id}</span>
        </div>
      </div>

      {/* NAV BUTTONS */}
      <div className="flex gap-3 pb-2 border-b">

        <Link href={`/admin/dtdc/clients/${id}/track`}>
          <Button variant={tab === "track" ? "default" : "outline"}>Track</Button>
        </Link>

        <Button
          variant={tab === "book" ? "default" : "outline"}
          onClick={() => setTab("book")}
        >
          Book
        </Button>

        <Button
          variant={tab === "bulk" ? "default" : "outline"}
          onClick={() => setTab("bulk")}
        >
          Bulk Book
        </Button>

        <Button
          variant={tab === "cancel" ? "default" : "outline"}
          onClick={() => setTab("cancel")}
        >
          Cancel AWB
        </Button>
      </div>

      {/* MAIN CONTENT (Modules Switch) */}
      <div>
        {tab === "book" && <ClientBook clientId={id} />}
        {tab === "bulk" && <BulkBook clientId={id} />}
        {tab === "cancel" && <CancelAwb clientId={id} />}
      </div>

      {/* PENDING SHIPMENTS */}
      <Card className="p-5 mt-6 border rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Pending Shipments</h2>

        {loadingPending ? (
          <div className="text-gray-500 p-4">Loading pending consignments...</div>
        ) : pendingConsignments.length === 0 ? (
          <div className="text-gray-500 p-4">No pending consignments.</div>
        ) : (
          <div className="border rounded-md divide-y">

            {pendingConsignments.map((c: any) => (
              <div
                key={c.id}
                className="p-4 flex justify-between items-center hover:bg-gray-50 transition"
              >
                <div>
                  <div className="font-semibold">AWB: {c.awb}</div>

                  <div className="text-sm text-gray-600">
                    Provider: {c.provider?.toUpperCase() ?? "N/A"}
                  </div>

                  <div className="text-sm text-gray-500">
                    Status: {c.last_status}
                  </div>
                </div>

                <div className="text-xs text-gray-500 text-right">
                  {new Date(c.created_at).toLocaleString()}
                </div>
              </div>
            ))}

          </div>
        )}
      </Card>
    </div>
  );
}

/* ---------------------------
   CHILD MODULE PLACEHOLDERS
--------------------------- */
function ClientBook({ clientId }: { clientId: string }) {
  return <Card className="p-4">Single Booking Module</Card>;
}

function BulkBook({ clientId }: { clientId: string }) {
  return <Card className="p-4">Bulk Booking Module</Card>;
}

function CancelAwb({ clientId }: { clientId: string }) {
  return <Card className="p-4">Cancel AWB Module</Card>;
}