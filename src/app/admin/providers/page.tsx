import Link from "next/link";
import DeleteProviderButton from "./DeleteProviderButton";
import { Pencil } from "lucide-react";

export default async function ProvidersPage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/providers`, {
    cache: "no-store",
  });
  const data = await res.json();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Providers</h1>

        <Link
          href="/admin/providers/new"
          className="px-5 py-2.5 bg-black text-white rounded-lg shadow hover:bg-gray-900 transition"
        >
          + Add Provider
        </Link>
      </div>

      <div className="grid gap-4">
        {data.providers.map((p: any) => (
          <div
            key={p.id}
            className="group border rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition flex justify-between items-center"
          >
            <div>
              <div className="font-semibold text-lg group-hover:text-black/90">{p.name}</div>
              <div className="text-sm text-gray-500 mt-0.5">{p.key}</div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <Link
                href={`/admin/providers/${p.id}/edit`}
                className="flex items-center gap-1 text-blue-600 hover:underline"
              >
                <Pencil size={16} /> Edit
              </Link>

              <DeleteProviderButton id={p.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
