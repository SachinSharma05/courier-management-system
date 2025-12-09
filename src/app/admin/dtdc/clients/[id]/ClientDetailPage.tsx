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

  const [tab, setTab] = useState<"track" | "book" | "bulk" | "cancel" | "pincode" | "reports" | "edit" | "credentials">("track");

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
  <div className="space-y-6 p-4">

    {/* HEADER */}
    <div className="flex justify-between items-start">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{client.company_name}</h1>
        <p className="text-gray-500 text-sm">{client.email}</p>
      </div>

      <div className="text-sm text-gray-500 bg-white px-3 py-1.5 rounded-lg shadow border">
        Client ID: <span className="font-semibold">#{client.id}</span>
      </div>
    </div>

    {/* SECTION NAVIGATION */}
    <div className="bg-white border rounded-xl shadow-sm p-3 flex flex-wrap gap-3">

      <Link href={`/admin/dtdc/clients/${id}/track`}>
        <Button
          size="sm"
          variant={tab === "track" ? "default" : "outline"}
          className="flex items-center gap-2"
        >
          📦 Track Consignments
        </Button>
      </Link>

      <Link href={`/admin/dtdc/clients/${id}/book`}>
        <Button
          size="sm"
          variant={tab === "book" ? "default" : "outline"}
          className="flex items-center gap-2"
        >
          ➕ Book Shipment
        </Button>
      </Link>

      <Link href={`/admin/dtdc/clients/${id}/bulk-book`}>
        <Button
          size="sm"
          variant={tab === "bulk" ? "default" : "outline"}
          className="flex items-center gap-2"
        >
          📚 Bulk Book
        </Button>
      </Link>

      <Link href={`/admin/dtdc/clients/${id}/cancel`}>
        <Button
          size="sm"
          variant={tab === "cancel" ? "default" : "outline"}
          className="flex items-center gap-2"
        >
          ❌ Cancel Shipment
        </Button>
      </Link>

      <Link href={`/admin/dtdc/clients/${id}/pincode`}>
        <Button
          size="sm"
          variant={tab === "pincode" ? "default" : "outline"}
          className="flex items-center gap-2"
        >
          🧭 Pincode Serviceability
        </Button>
      </Link>

      <Link href={`/admin/dtdc/clients/${id}/reports`}>
        <Button
          size="sm"
          variant={tab === "reports" ? "default" : "outline"}
          className="flex items-center gap-2"
        >
          📊 Reports
        </Button>
      </Link>

      <Link href={`/admin/dtdc/clients/${id}/edit`}>
        <Button
          size="sm"
          variant={tab === "edit" ? "default" : "outline"}
          className="flex items-center gap-2"
        >
          ✏️ Edit Client
        </Button>
      </Link>

      <Link href={`/admin/dtdc/clients/${id}/credentials`}>
        <Button
          size="sm"
          variant={tab === "credentials" ? "default" : "outline"}
          className="flex items-center gap-2"
        >
          🔐 Edit Credentials
        </Button>
      </Link>
    </div>

    {/* PENDING SHIPMENTS */}
    <Card className="p-5 border rounded-xl shadow-sm bg-white">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Pending Shipments</h2>
        <span className="text-sm text-gray-500">
          Total: {pendingConsignments?.length || 0}
        </span>
      </div>

      {loadingPending ? (
        <div className="text-gray-500 p-4">Loading pending consignments...</div>
      ) : pendingConsignments.length === 0 ? (
        <div className="text-gray-500 p-4">No pending consignments.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-700">AWB</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Provider</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Created At</th>
              </tr>
            </thead>

            <tbody>
              {pendingConsignments.map((c: any) => (
                <tr
                  key={c.id}
                  className="hover:bg-gray-50 transition border-b"
                >
                  <td className="px-4 py-3 font-semibold">{c.awb}</td>
                  <td className="px-4 py-3 uppercase text-gray-700">{c.provider ?? "N/A"}</td>
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