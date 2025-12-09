"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import {
  Home,
  Search,
  FileText,
  Layers,
  Package,
  Truck,
  Users,
  Settings,
  Menu,
  LogOut,
  Boxes,
  ClipboardList,
  Building2
} from "lucide-react";
import { SidebarProps } from "@/interface/SidebarProps";

const SIDEBAR_WIDE = "w-64";
const SIDEBAR_NARROW = "w-20"; // ✔ Bigger so icons never cut off

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [hovering, setHovering] = useState(false);
  const isExpanded = sidebarOpen || hovering;

  // open/close sections
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.clear();
    sessionStorage.clear();
    router.push("/auth/login");
  }

  return (
    <aside
  onMouseEnter={() => setHovering(true)}
  onMouseLeave={() => setHovering(false)}
  className={`
    fixed left-0 top-0 h-screen z-50
    bg-gradient-to-b from-[#0f172a] via-[#1e3a8a] to-[#1e40af]
    border-r border-white/10
    shadow-xl shadow-black/20
    text-white
    transition-all duration-300 ease-in-out flex flex-col
    ${isExpanded ? SIDEBAR_WIDE : SIDEBAR_NARROW}
  `}
>

      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
  {isExpanded && (
    <span className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent drop-shadow-sm">
      Admin Panel
    </span>
  )}

  <button
    onClick={() => setSidebarOpen((s) => !s)}
    className="p-2 rounded-lg hover:bg-white/10 transition text-white/80 hover:text-white"
  >
    <Menu size={20} />
  </button>
</div>


      {/* NAVIGATION */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
        <SidebarItem
          href="/admin"
          label="Dashboard"
          icon={<Home size={20} />}
          active={pathname === "/admin"}
          isExpanded={isExpanded}
        />

        {isExpanded && <SectionLabel label="Providers" />}
        <SidebarItem
          href="/admin/dtdc"
          label="DTDC"
          icon={<Boxes size={20} className="text-blue-600" />}
          active={pathname.startsWith("/admin/detdc")}
          isExpanded={isExpanded}
        />

        <SidebarItem
          href="/admin/delhivery"
          label="Delhivery"
          icon={<Truck size={20} className="text-orange-500" />}
          active={pathname.startsWith("/admin/delhivery")}
          isExpanded={isExpanded}
        />

        <SidebarItem
          href="/admin/xpressbees"
          label="XpressBees"
          icon={<Building2 size={20} className="text-yellow-500" />}
          active={pathname.startsWith("/admin/xpressbees")}
          isExpanded={isExpanded}
        />

        <SidebarItem
          href="/admin/aramex"
          label="Maruti"
          icon={<Package size={20} className="text-yellow-500" />}
          active={pathname.startsWith("/admin/aramex")}
          isExpanded={isExpanded}
        />

        {isExpanded && <SectionLabel label="Clients & Providers" />}
        <SidebarItem
          href="/admin/dtdc/clients"
          label="Clients"
          icon={<Users size={18} />}
          active={pathname.startsWith("/admin/dtdc/clients")}
          isExpanded={isExpanded}
        />

        <SidebarItem
          href="/admin/providers"
          label="Providers"
          icon={<Users size={18} />}
          active={pathname.startsWith("/admin/providers")}
          isExpanded={isExpanded}
        />

        {isExpanded && <SectionLabel label="Billing & Finance" />}

        <SidebarItem
          href="/admin/billing"
          label="Billing Overview"
          icon={<Layers size={18} />}
          active={pathname.startsWith("/admin/billing")}
          isExpanded={isExpanded}
        />

        <SidebarItem
          href="/admin/billing/invoices"
          label="Invoices"
          icon={<FileText size={18} />}
          active={pathname.startsWith("/admin/billing/invoices")}
          isExpanded={isExpanded}
        />

        <SidebarItem
          href="/admin/finance"
          label="Finance Reports"
          icon={<ClipboardList size={18} />}
          active={pathname.startsWith("/admin/finance")}
          isExpanded={isExpanded}
        />

        {isExpanded && <SectionLabel label="Complaints" />}

        <SidebarItem
          href="/admin/complaints"
          label="All Complaints"
          icon={<Search size={18} />}
          active={pathname.startsWith("/admin/complaints")}
          isExpanded={isExpanded}
        />
		
		    <SidebarItem
          href="/admin/dtdc/settings"
          label="Settings"
          icon={<Settings size={17} />}
          active={pathname.startsWith("/admin/settings")}
          isExpanded={isExpanded}
        />
      </nav>

      {/* FOOTER */}
      <div className="border-t border-white/10 px-4 py-4 mt-auto">
  <button
    onClick={logout}
    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg 
      text-red-300 hover:text-red-400 hover:bg-red-900/20 transition"
  >
    <LogOut size={20} />
    {isExpanded && <span>Logout</span>}
  </button>
</div>

    </aside>
  );
}

/* ---- Sub Components ---- */

function SectionLabel({ label }: any) {
  return (
    <div className="px-3 text-[10px] uppercase tracking-wide text-white/40 font-semibold">
      {label}
    </div>
  );
}

function SidebarItem({ href, label, icon, active, isExpanded }: any) {
  return (
    <Link
      href={href}
      className={`
        group flex items-center gap-3 px-3 py-2 rounded-lg relative
        transition-all duration-200
        ${active 
          ? "bg-white/20 text-white shadow-sm" 
          : "text-white/70 hover:text-white hover:bg-white/10"
        }
      `}
    >
      {/* Active Left Indicator */}
      {active && (
        <span className="absolute left-0 top-0 h-full w-[3px] bg-white rounded-r-lg shadow-md"></span>
      )}

      {/* Icon */}
      <span className="group-hover:scale-110 transition-transform duration-200">
        {icon}
      </span>

      {/* Label (only visible when expanded) */}
      {isExpanded && <span className="text-sm font-medium">{label}</span>}
    </Link>
  );
}
