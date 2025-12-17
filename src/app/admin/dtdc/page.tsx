"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EditClientForm from "./clients/[id]/editclient/EditClientForm";
import CredentialsForm from "./credentials/CredentialsForm";

import { CPDP } from "@/interface/CPDP";
import AddClientForm from "./clients/newclient/page";
import BookShipmentForm from "@/components/admin/BookShipmentForm";
import BulkBookingPage from "@/components/admin/BulkBookShipmentForm";
import CancelShipmentForm from "@/components/admin/CancelShipmentForm";
import { FileText, KeyRound, Layers, Package, Pencil, Search } from "lucide-react";

/* ================= TYPES ================= */
const SORT_OPTIONS = [
  { key: "total", label: "Total" },
  { key: "delivered", label: "Delivered" },
  { key: "pending", label: "Pending" },
  { key: "rto", label: "RTO" },
];

/* ================= PAGE ================= */

export default function DtdcDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<keyof CPDP>("total");
  const [addOpen, setAddOpen] = useState(false);

  const [bookOpen, setBookOpen] = useState(false);
  const [bulkBookOpen, setBulkBookOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  const [favorites, setFavorites] = useState<number[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("dtdc_favorites") || "[]");
    } catch {
      return [];
    }
  });

  /* ---------------- Load stats ---------------- */
  useEffect(() => {
    fetch("/api/admin/dtdc/dashboard/stats?provider=dtdc")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  /* ---------------- Filter + sort ---------------- */
  const cpdpList: CPDP[] = useMemo(() => {
    if (!stats?.clients) return [];

    const filtered = stats.clients.filter((c: CPDP) =>
      c.company_name.toLowerCase().includes(query.toLowerCase())
    );

    const sorted = [...filtered].sort(
      (a, b) => (Number(b[sortKey]) || 0) - (Number(a[sortKey]) || 0)
    );

    return sorted.sort((a, b) => {
      const af = favorites.includes(a.client_id);
      const bf = favorites.includes(b.client_id);
      return af === bf ? 0 : af ? -1 : 1;
    });
  }, [stats, query, sortKey, favorites]);

  useEffect(() => {
    localStorage.setItem("dtdc_favorites", JSON.stringify(favorites));
  }, [favorites]);

  if (!stats) return <div className="p-8">Loading…</div>;

  /* ---------------- Helpers ---------------- */

  function toggleFav(id: number) {
    setFavorites((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  function exportCSV() {
    const rows = [
      ["Company", "Total", "Delivered", "Pending", "RTO"],
      ...cpdpList.map((c) => [
        c.company_name,
        c.total,
        c.delivered,
        c.pending,
        c.rto,
      ]),
    ];
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], {
      type: "text/csv",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "dtdc_cpdp_stats.csv";
    a.click();
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">

      {/* HEADER */}
      <h1 className="text-2xl font-bold">DTDC Dashboard</h1>
      <p className="text-sm text-muted-foreground">
        Overview and quick actions for DTDC shipments
      </p>

      {/* SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ["Total Shipments", stats.total, "all", "blue"],
          ["Delivered", stats.delivered, "delivered", "green"],
          ["Pending", stats.pending, "pending", "yellow"],
          ["RTO", stats.rto, "rto", "red"],
        ].map(([l, v, s, c]: any) => (
          <Link key={l} href={`/admin/providerTrack/dtdc?status=${s}`}>
            <div className="bg-white border rounded-xl p-4 hover:shadow">
              <div className="text-xs text-gray-500">{l}</div>
              <div className={`text-2xl font-bold text-${c}-600`}>{v}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* QUICK ACTIONS */}
      <div className="flex flex-wrap gap-3 bg-white border rounded-xl p-4">
        <Link href="/admin/dtdc/track"><Button variant="outline"><Search size={15} />Track Shipment</Button></Link>
        <Link href="/admin/upload"><Button variant="outline"><Layers size={15} />Bulk Upload & Track</Button></Link>
        <Link href="/admin/dtdc/label"><Button variant="outline"><FileText size={15} />Print Label</Button></Link>
        <Button onClick={() => setAddOpen(true)}>+ Add Client</Button>
      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-xl overflow-hidden">

        <div className="px-5 py-4 border-b flex justify-between">
          <h3 className="font-semibold text-lg">DTDC – CPDP Clients</h3>

          <div className="flex gap-3">
            <input
              placeholder="Search CPDP…"
              className="border rounded-md px-3 py-2 text-sm w-56"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <select
              className="border rounded-md px-3 py-2 text-sm"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as any)}
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.key} value={s.key}>
                  Sort by {s.label}
                </option>
              ))}
            </select>

            <Button size="sm" variant="outline" onClick={exportCSV}>
              Export CSV
            </Button>
          </div>
        </div>

        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 w-10"></th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3 text-center">Total</th>
              <th className="px-4 py-3 text-center">Delivered</th>
              <th className="px-4 py-3 text-center">Pending</th>
              <th className="px-4 py-3 text-center">RTO</th>
              <th className="px-4 py-3 text-right">Actions</th>
              <th className="px-4 py-3">Services</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {cpdpList.map((c) => {
              const fav = favorites.includes(c.client_id);
              return (
                <tr key={c.client_id} className={fav ? "bg-yellow-50/40" : ""}>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleFav(c.client_id)}>
                      {fav ? "⭐" : "☆"}
                    </button>
                  </td>

                  {/* 🔥 CHANGED PART */}
                  <td className="px-4 py-3 font-medium">
                    <ClientMenu client={c} />
                  </td>

                  <td className="px-4 py-3 text-center"><CountBadge value={c.total} color="blue" /></td>
                  <td className="px-4 py-3 text-center"><CountBadge value={c.delivered} color="green" /></td>
                  <td className="px-4 py-3 text-center"><CountBadge value={c.pending} color="yellow" /></td>
                  <td className="px-4 py-3 text-center"><CountBadge value={c.rto} color="red" /></td>

                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/dtdc/clients/${c.client_id}/track?status=all`}>
                      <ActionBtn label="Track" color="blue" />
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="outline" onClick={() => {setSelectedClientId(c.client_id); setBookOpen(true)}} value={c.client_id}><Package size={15} />Book Shipment</Button>
                    <Button variant="outline" onClick={() => {setSelectedClientId(c.client_id); setBulkBookOpen(true)}}><Layers size={15} />Book Bulk Shipments</Button>
                    <Button variant="destructive" onClick={() => {setSelectedClientId(c.client_id); setCancelOpen(true)}}>Cancel Shipment</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AddClientModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={() => {
          setAddOpen(false);
          window.location.reload(); // keep logic same
        }}
      />

      <Dialog open={bookOpen} onOpenChange={setBookOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Create Shipment</DialogTitle>
          </DialogHeader>
          {selectedClientId && (
            <BookShipmentForm clientId={selectedClientId} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={bulkBookOpen} onOpenChange={setBulkBookOpen}>
        <DialogContent className="max-w-6xl h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Bulk Upload Shipments</DialogTitle>
          </DialogHeader>
          <div className="h-full overflow-auto pr-2">
            {selectedClientId && (
              <BulkBookingPage clientId={selectedClientId} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Cancel Shipments</DialogTitle>
          </DialogHeader>
          {selectedClientId && (
            <CancelShipmentForm clientId={selectedClientId} />
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}

/* ================= CLIENT MENU ================= */

function ClientMenu({ client }: { client: CPDP }) {
  const [edit, setEdit] = useState(false);
  const [cred, setCred] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="text-blue-600 hover:underline">
            {client.company_name}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setEdit(true)}><Pencil size={15} />Edit</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setCred(true)}><KeyRound size={15} />Credentials</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditClientModal open={edit} onOpenChange={setEdit} clientId={client.client_id} />
      <CredentialsModal open={cred} onOpenChange={setCred} clientId={client.client_id} />
    </>
  );
}

/* ================= MODALS ================= */

function EditClientModal({
  open,
  onOpenChange,
  clientId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clientId: number;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
        </DialogHeader>

        <EditClientForm
          id={String(clientId)}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function CredentialsModal({
  open,
  onOpenChange,
  clientId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clientId: number;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Client Credentials</DialogTitle>
        </DialogHeader>

        <CredentialsForm
          id={String(clientId)}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function AddClientModal({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add Client</DialogTitle>
        </DialogHeader>

        <AddClientForm
          onSuccess={() => {
            onOpenChange(false);
            onCreated(); // refresh list
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

/* ================= HELPERS ================= */
type BadgeColor = "blue" | "green" | "yellow" | "red";

function CountBadge({
  value,
  color,
}: {
  value: number;
  color: BadgeColor;
}) {
  const map = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
    red: "bg-red-100 text-red-700",
  };
  return <span className={`px-2 py-1 rounded-full text-sm ${map[color]}`}>{value}</span>;
}

function ActionBtn({
  label,
  color,
}: {
  label: string;
  color: BadgeColor;
}) {
  const map = {
    blue: "bg-blue-100 text-blue-800",
    green: "bg-green-50 text-green-700",
    yellow: "bg-yellow-50 text-yellow-700",
    red: "bg-red-50 text-red-700",
  };
  return <button className={`px-3 py-1 rounded-md text-sm ${map[color]}`}>{label}</button>;
}