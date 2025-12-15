// components/admin/provider-meta.ts
export const PROVIDER_META: Record<string, {
  name: string;
  href: string;
  gradient: string;
}> = {
  dtdc: {
    name: "DTDC",
    href: "/admin/dtdc",
    gradient: "from-blue-500 to-blue-700",
  },
  delhivery: {
    name: "Delhivery",
    href: "/admin/delhivery",
    gradient: "from-orange-500 to-red-500",
  },
  xpressbees: {
    name: "XpressBees",
    href: "/admin/xpressbees",
    gradient: "from-yellow-400 to-orange-400",
  },
  maruti: {
    name: "Maruti",
    href: "/admin/maruti",
    gradient: "from-purple-500 to-indigo-500",
  },
};
