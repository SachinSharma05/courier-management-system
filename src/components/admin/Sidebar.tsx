"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import {
  Home,
  Search,
  MapPin,
  FileText,
  Layers,
  Package,
  Truck,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
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
  const [dtdcOpen, setDtdcOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [xbOpen, setXbOpen] = useState(false);

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
        fixed left-0 top-0 h-screen z-50 backdrop-blur-xl 
        bg-[rgba(255,255,255,0.75)] border-r border-gray-200
        shadow-[0_8px_32px_rgba(0,0,0,0.1)]
        transition-all duration-300 ease-in-out flex flex-col
        ${isExpanded ? SIDEBAR_WIDE : SIDEBAR_NARROW}
      `}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
        {isExpanded && (
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Control Panel
          </span>
        )}

        <button
          onClick={() => setSidebarOpen((s) => !s)}
          className="p-2 rounded-lg hover:bg-white/40 transition"
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

        <ProviderSection
          title="DTDC"
          icon={<Boxes size={20} className="text-blue-600" />}
          open={dtdcOpen}
          toggle={() => setDtdcOpen(!dtdcOpen)}
          isExpanded={isExpanded}
        >
          <SidebarLink
            href="/admin/dtdc/track"
            label="Track Consignment"
            icon={<Search size={16} />}
            active={pathname.startsWith("/admin/dtdc/track")}
            isExpanded={isExpanded}
          />
          <SidebarLink
            href="/admin/dtdc/pincode"
            label="Pincode Serviceability"
            icon={<MapPin size={16} />}
            active={pathname.startsWith("/admin/dtdc/pincode")}
            isExpanded={isExpanded}
          />
        </ProviderSection>

        <ProviderSection
          title="Delhivery"
          icon={<Truck size={20} className="text-orange-500" />}
          open={delOpen}
          toggle={() => setDelOpen(!delOpen)}
          isExpanded={isExpanded}
        >
          <SidebarLink
            href="/admin/delhivery/track"
            label="Track Consignment"
            icon={<Search size={16} />}
            isExpanded={isExpanded}
          />
        </ProviderSection>

        <ProviderSection
          title="XpressBees"
          icon={<Building2 size={20} className="text-yellow-500" />}
          open={xbOpen}
          toggle={() => setXbOpen(!xbOpen)}
          isExpanded={isExpanded}
        >
          <SidebarLink
            href="/admin/xpress/track"
            label="Track Consignment"
            icon={<Search size={16} />}
            isExpanded={isExpanded}
          />
        </ProviderSection>

        <SidebarItem
          href="/admin/dtdc/clients"
          label="Clients"
          icon={<Users size={18} />}
          active={pathname.startsWith("/admin/dtdc/clients")}
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
      <div className="border-t border-gray-200 px-4 py-4 mt-auto">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg 
            text-red-600 hover:bg-red-50 transition"
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
    <div className="px-3 text-[11px] uppercase tracking-wide text-gray-500">
      {label}
    </div>
  );
}

function ProviderSection({ title, icon, open, toggle, isExpanded, children }: any) {
  return (
    <div className="space-y-1">
      <button
        onClick={toggle}
        className="flex items-center justify-between w-full px-3 py-2 
        rounded-lg hover:bg-white/40 transition"
      >
        <div className="flex items-center gap-3">{icon}{isExpanded && <span className="font-medium">{title}</span>}</div>
        {isExpanded && (open ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
      </button>

      {/* Always show icons even when collapsed */}
      {open && (
        <div className="ml-2 pl-3 border-l border-gray-300 space-y-1 transition-all">
          {children}
        </div>
      )}
    </div>
  );
}

function SidebarLink({ href, label, icon, active, isExpanded }: any) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition 
        ${active ? "bg-blue-100 text-blue-700 shadow-sm" : "hover:bg-white/60"}
      `}
    >
      {icon}
      {isExpanded && <span>{label}</span>}
    </Link>
  );
}

function SidebarItem({ href, label, icon, active, isExpanded }: any) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition 
        ${active ? "bg-blue-100 text-blue-700 shadow-sm" : "hover:bg-white/60"}
      `}
    >
      {icon}
      {isExpanded && <span>{label}</span>}
    </Link>
  );
}
