import { Pencil } from "lucide-react";
import Link from "next/link";
import DeleteProviderButton from "./DeleteProviderButton";

export default async function ProvidersPage() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/providers`,
    { cache: "no-store" }
  );
  const data = await res.json();

  const groups = categorizeProviders(data.providers);

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* HEADER + BREADCRUMB ROW */}
      <div className="flex items-start justify-between gap-4">
        {/* LEFT: Title + subtitle */}
        <div>
          <h1 className="text-2xl font-bold leading-tight">
            Courier Providers Dashboard
          </h1>
        </div>

        {/* RIGHT: Breadcrumb */}
        <nav className="text-sm text-gray-500 flex gap-2 items-center whitespace-nowrap">
          <Link href="/admin" className="hover:underline">Home</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">Providers</span>
        </nav>

        <Link
        href="/admin/providers/new"
        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 
                   text-white rounded-lg shadow hover:shadow-lg hover:-translate-y-0.5 
                   transition-all"
      >
        + Add Provider
      </Link>
      </div>

      {/* SECTIONS */}
      <ProviderSection
        title="Top National Courier Providers"
        subtitle="Widely used pan-India delivery partners"
        items={groups.national}
      />

      <ProviderSection
        title="E-commerce & Hyperlocal Specialists"
        subtitle="Optimized for marketplace & same-day deliveries"
        items={groups.ecommerce}
      />

      <ProviderSection
        title="International & Global Providers"
        subtitle="Cross-border and global logistics networks"
        items={groups.international}
      />

      <ProviderSection
        title="Specialized & Regional Providers"
        subtitle="Niche, regional or custom courier partners"
        items={groups.regional}
      />
    </div>
  );
}

// Helper Methods
function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

function categorizeProviders(providers: any[]) {
  return {
    national: providers.filter((p) =>
      ["dtdc", "delhivery", "bluedart", "indiapost", "gati"].includes(
        normalize(p.name)
      )
    ),

    ecommerce: providers.filter((p) =>
      ["xpressbees", "ecomexpress", "shadowfax", "ekartlogistics", "safexpress"].includes(
        normalize(p.name)
      )
    ),

    international: providers.filter((p) =>
      ["fedex", "dhl", "ups", "tnt", "aramex"].includes(
        normalize(p.name)
      )
    ),

    regional: providers.filter((p) =>
      ![
        "dtdc",
        "delhivery",
        "bluedart",
        "indiapost",
        "gati",
        "xpressbees",
        "ecomexpress",
        "shadowfax",
        "ekartlogistics",
        "safexpress",
        "fedex",
        "dhl",
        "ups",
        "tnt",
        "aramex",
      ].includes(normalize(p.name))
    ),
  };
}

function ProviderCard({ p }: { p: any }) {
  const initials = p.name
    .split(" ")
    .map((x: string) => x[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className="
        flex items-center justify-between 
        rounded-lg border bg-white px-4 py-3
        hover:shadow-md transition
      "
    >
      {/* LEFT */}
      <div className="flex items-center gap-3">
        <div
          className="
            h-10 w-10 rounded-md
            bg-gradient-to-br from-indigo-600 to-blue-600
            flex items-center justify-center
            text-white text-sm font-semibold
          "
        >
          {initials}
        </div>

        <div>
          <div className="font-medium leading-tight">{p.name}</div>
          <div className="text-xs text-gray-500">{p.key}</div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2">
        <Link
          href={`/admin/providers/${p.id}/edit`}
          className="
            inline-flex items-center gap-1
            px-2.5 py-1.5 rounded-md
            text-xs font-medium
            bg-blue-50 text-blue-700 border border-blue-200
            hover:bg-blue-100
          "
        >
          <Pencil size={13} /> Edit
        </Link>

        <DeleteProviderButton
          id={p.id}
          className="
            inline-flex items-center
            px-2.5 py-1.5 rounded-md
            text-xs font-medium
            bg-red-50 text-red-700 border border-red-200
            hover:bg-red-100
          "
        />
      </div>
    </div>
  );
}

function ProviderSection({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: any[];
}) {
  if (!items.length) return null;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((p) => (
          <ProviderCard key={p.id} p={p} />
        ))}
      </div>
    </section>
  );
}