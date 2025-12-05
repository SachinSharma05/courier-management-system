import Link from "next/link";
import { db } from "@/app/db/postgres";
import { users, clientCredentials } from "@/app/db/schema";
import { eq } from "drizzle-orm";
import { Pencil, KeyRound, Search, FileText, Layers, Package } from "lucide-react";

export default async function ClientsPage() {
  const clients = await db
    .select()
    .from(users)
    .where(eq(users.role, "client"));

  const creds = await db.select().from(clientCredentials);

  // Group provider info
  const clientRows = clients.map((c) => {
    const cCreds = creds.filter((k) => k.client_id === c.id);

    // Extract unique provider IDs
    const providerIds = [...new Set(cCreds.map((k) => k.provider_id))];

    return {
      ...c,
      providersConfigured: providerIds,
    };
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Clients</h1>

        <Link
          href="/admin/clients/new"
          className="px-5 py-2.5 bg-black text-white rounded-lg shadow hover:bg-gray-900 transition"
        >
          + Add Client
        </Link>
      </div>

      {/* Client List */}
      <div className="grid gap-4">
        {clientRows.map((c) => (
          <div
            key={c.id}
            className="group border rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition"
          >
            <div className="flex justify-between items-start">
              
              {/* Left: Client Info */}
              <div>
                <div className="font-semibold text-lg group-hover:text-black/90">
                  {c.company_name || c.username}
                </div>
                <div className="text-sm text-gray-500">{c.email}</div>

                {/* Providers */}
                <div className="flex gap-2 mt-3">
                  {c.providersConfigured.length === 0 && (
                    <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-500">
                      No Providers
                    </span>
                  )}

                  {c.providersConfigured.includes(1) && (
                    <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
                      DTDC
                    </span>
                  )}

                  {c.providersConfigured.includes(2) && (
                    <span className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-700">
                      Delhivery
                    </span>
                  )}

                  {c.providersConfigured.includes(3) && (
                    <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700">
                      XpressBees
                    </span>
                  )}

                  {c.providersConfigured.includes(4) && (
                    <span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-700">
                      Trackon
                    </span>
                  )}

                  {c.providersConfigured.includes(5) && (
                    <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">
                      Ecom Express
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Quick Actions */}
              <div className="flex flex-col gap-2 text-sm items-end">

                <div className="flex gap-4">
                  <Link
                    href={`/admin/clients/${c.id}/track`}
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    <Search size={16} /> Track
                  </Link>

                  <Link
                    href={`/admin/clients/${c.id}/book`}
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    <Package size={16} /> Book
                  </Link>

                  <Link
                    href={`/admin/clients/${c.id}/bulk`}
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    <Layers size={16} /> Bulk
                  </Link>

                  <Link
                    href={`/admin/clients/${c.id}/reports`}
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    <FileText size={16} /> Reports
                  </Link>
                </div>

                <div className="flex gap-4 mt-1">
                  <Link
                    href={`/admin/clients/${c.id}/edit`}
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    <Pencil size={16} /> Edit
                  </Link>

                  <Link
                    href={`/admin/clients/${c.id}/credentials`}
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    <KeyRound size={16} /> Credentials
                  </Link>
                </div>

              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}