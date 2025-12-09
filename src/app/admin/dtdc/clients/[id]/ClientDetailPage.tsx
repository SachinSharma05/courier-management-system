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
          <Button variant={tab === "track" ? "default" : "outline"}>Track Consignments</Button>
        </Link>

        <Link href={`/admin/dtdc/clients/${id}/book`}>
          <Button
            variant={tab === "book" ? "default" : "outline"}
          >
            Book Shipment
          </Button>
        </Link>
        
        <Link href={`/admin/dtdc/clients/${id}/bulk-book`}>
          <Button
            variant={tab === "bulk" ? "default" : "outline"}
          >
            Bulk Book Shipment
          </Button>
        </Link>
        
        <Link href={`/admin/dtdc/clients/${id}/cancel`}>
          <Button
            variant={tab === "cancel" ? "default" : "outline"}
          >
            Cancel Shipment
          </Button>
        </Link>

        <Link href={`/admin/dtdc/clients/${id}/cancel`}>
          <Button
            variant={tab === "cancel" ? "default" : "outline"}
          >
            Pincode Serviceability
          </Button>
        </Link>

        <Link href={`/admin/dtdc/clients/${id}/cancel`}>
          <Button
            variant={tab === "cancel" ? "default" : "outline"}
          >
            Reports
          </Button>
        </Link>

        <Link href={`/admin/dtdc/clients/${id}/cancel`}>
          <Button
            variant={tab === "cancel" ? "default" : "outline"}
          >
            Edit Client
          </Button>
        </Link>

        <Link href={`/admin/dtdc/clients/${id}/cancel`}>
          <Button
            variant={tab === "cancel" ? "default" : "outline"}
          >
            Edit Credentials
          </Button>
        </Link>
      </div>

      {/* PENDING SHIPMENTS */}
      <Card className="p-5 mt-6 border rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold">Pending Shipments</h2>

        {loadingPending ? (
          <div className="text-gray-500 p-4">Loading pending consignments...</div>
        ) : pendingConsignments.length === 0 ? (
          <div className="text-gray-500 p-4">No pending consignments.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border rounded-md">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">AWB</th>
                  <th className="px-4 py-2 text-left font-medium">Provider</th>
                  <th className="px-4 py-2 text-left font-medium">Status</th>
                  <th className="px-4 py-2 text-left font-medium">Created At</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {pendingConsignments.map((c: any) => (
                  <tr
                    key={c.id}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-3 font-semibold">{c.awb}</td>
                    <td className="px-4 py-3 uppercase">{c.provider ?? "N/A"}</td>
                    <td className="px-4 py-3">{c.last_status}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(c.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}