import Link from "next/link";
import DeleteProviderButton from "./DeleteProviderButton";
import { Pencil } from "lucide-react";

export default async function ProvidersPage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/providers`, {
    cache: "no-store",
  });
  const data = await res.json();

  return (
  <div className="p-6 space-y-6">

    {/* HEADER */}
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold tracking-tight">Providers</h1>

      <Link
        href="/admin/providers/new"
        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 
                   text-white rounded-lg shadow hover:shadow-lg hover:-translate-y-0.5 
                   transition-all"
      >
        + Add Provider
      </Link>
    </div>

    {/* PROVIDER GRID */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {data.providers.map((p: any) => {

        // Initials for avatar
        const initials = p.name
          .split(" ")
          .map((x: string) => x[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();

        return (
          <div
            key={p.id}
            className="
              rounded-xl p-5 bg-white border shadow-sm 
              hover:shadow-xl hover:-translate-y-1 
              transition-all duration-200 flex justify-between items-start
            "
          >
            {/* LEFT — Avatar + provider info */}
            <div className="flex items-start gap-4">

              {/* Avatar bubble */}
              <div className="
                h-12 w-12 rounded-lg 
                bg-gradient-to-br from-indigo-600 to-blue-600
                flex items-center justify-center 
                text-white font-semibold shadow
              ">
                {initials}
              </div>

              {/* Provider Details */}
              <div>
                <div className="font-semibold text-lg">{p.name}</div>
                <div className="text-sm text-gray-500">{p.key}</div>
              </div>
            </div>

            {/* RIGHT — Buttons */}
            <div className="flex flex-col gap-2 items-end">

              {/* EDIT BUTTON */}
              <Link
                href={`/admin/providers/${p.id}/edit`}
                className="
                  flex items-center justify-center gap-1 
                  px-3 py-2 rounded-md bg-blue-50 text-blue-700 
                  border border-blue-200 hover:bg-blue-100 
                  transition text-sm
                "
              >
                <Pencil size={15} /> Edit
              </Link>

              {/* DELETE BUTTON */}
              <DeleteProviderButton
                id={p.id}
                className="
                  flex items-center justify-center gap-1 
                  px-3 py-2 rounded-md bg-red-50 text-red-700 
                  border border-red-200 hover:bg-red-100 
                  transition text-sm
                "
              />
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

}
