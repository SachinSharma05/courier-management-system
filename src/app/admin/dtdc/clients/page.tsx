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
  <div className="p-6 space-y-6">

    {/* HEADER */}
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold tracking-tight">Clients</h1>

      <Link
        href="/admin/clients/new"
        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 
                   text-white rounded-lg shadow hover:shadow-lg hover:-translate-y-0.5 
                   transition-all"
      >
        + Add Client
      </Link>
    </div>

    {/* CLIENT GRID */}
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {clientRows.map((c) => {
        const initials =
          (c.company_name || c.username || "")
            .split(" ")
            .map((x: string) => x[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();

        return (
          <div
            key={c.id}
            className="
              rounded-xl p-5 bg-white border shadow-sm 
              hover:shadow-xl hover:-translate-y-1 
              transition-all duration-200 flex flex-col justify-between
            "
          >
            {/* TOP: AVATAR + INFO */}
            <div className="flex items-start gap-4">

              {/* Avatar Badge */}
              <div className="
                h-12 w-12 rounded-lg 
                bg-gradient-to-br from-blue-600 to-indigo-600 
                flex items-center justify-center text-white font-bold shadow
              ">
                {initials}
              </div>

              {/* Client Info */}
              <div>
                <div className="font-semibold text-lg">{c.company_name || c.username}</div>
                <div className="text-sm text-gray-500">{c.email}</div>

                {/* Providers */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {c.providersConfigured.length === 0 && (
                    <span className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-500">
                      No Providers
                    </span>
                  )}

                  {c.providersConfigured.includes(1) && (
                    <span className="px-2 py-1 text-xs rounded border border-blue-200 text-blue-700 bg-blue-50">
                      DTDC
                    </span>
                  )}

                  {c.providersConfigured.includes(2) && (
                    <span className="px-2 py-1 text-xs rounded border border-orange-200 text-orange-700 bg-orange-50">
                      Delhivery
                    </span>
                  )}

                  {c.providersConfigured.includes(3) && (
                    <span className="px-2 py-1 text-xs rounded border border-yellow-200 text-yellow-700 bg-yellow-50">
                      XpressBees
                    </span>
                  )}

                  {c.providersConfigured.includes(4) && (
                    <span className="px-2 py-1 text-xs rounded border border-purple-200 text-purple-700 bg-purple-50">
                      Trackon
                    </span>
                  )}

                  {c.providersConfigured.includes(5) && (
                    <span className="px-2 py-1 text-xs rounded border border-green-200 text-green-700 bg-green-50">
                      Ecom Express
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="mt-5 space-y-3">

              {/* Quick Actions Row */}
              <div className="grid grid-cols-2 gap-3">

                <Link
                  href={`/admin/clients/${c.id}/track`}
                  className="
                    flex items-center justify-center gap-1 
                    px-3 py-2 rounded-md bg-blue-50 text-blue-700 
                    border border-blue-200 hover:bg-blue-100 transition text-sm
                  "
                >
                  <Search size={15} /> Track
                </Link>

                <Link
                  href={`/admin/clients/${c.id}/book`}
                  className="
                    flex items-center justify-center gap-1 
                    px-3 py-2 rounded-md bg-indigo-50 text-indigo-700 
                    border border-indigo-200 hover:bg-indigo-100 transition text-sm
                  "
                >
                  <Package size={15} /> Book
                </Link>

                <Link
                  href={`/admin/clients/${c.id}/bulk`}
                  className="
                    flex items-center justify-center gap-1 
                    px-3 py-2 rounded-md bg-yellow-50 text-yellow-700 
                    border border-yellow-200 hover:bg-yellow-100 transition text-sm
                  "
                >
                  <Layers size={15} /> Bulk
                </Link>

                <Link
                  href={`/admin/clients/${c.id}/reports`}
                  className="
                    flex items-center justify-center gap-1 
                    px-3 py-2 rounded-md bg-purple-50 text-purple-700 
                    border border-purple-200 hover:bg-purple-100 transition text-sm
                  "
                >
                  <FileText size={15} /> Reports
                </Link>
              </div>

              {/* Edit Row */}
              <div className="grid grid-cols-2 gap-3">

                <Link
                  href={`/admin/clients/${c.id}/edit`}
                  className="
                    flex items-center justify-center gap-1 
                    px-3 py-2 rounded-md bg-gray-50 text-gray-700 
                    border border-gray-200 hover:bg-gray-100 transition text-sm
                  "
                >
                  <Pencil size={15} /> Edit
                </Link>

                <Link
                  href={`/admin/clients/${c.id}/credentials`}
                  className="
                    flex items-center justify-center gap-1 
                    px-3 py-2 rounded-md bg-teal-50 text-teal-700 
                    border border-teal-200 hover:bg-teal-100 transition text-sm
                  "
                >
                  <KeyRound size={15} /> Credentials
                </Link>
              </div>

            </div>
          </div>
        );
      })}
    </div>
  </div>
);

}