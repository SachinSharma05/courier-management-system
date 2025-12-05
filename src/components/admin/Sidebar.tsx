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
} from "lucide-react";

const SIDEBAR_WIDE = "w-60";
const SIDEBAR_NARROW = "w-16";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [hovering, setHovering] = useState(false);

  // Expand while hovering OR when pinned by user click
  const isExpanded = sidebarOpen || hovering;

  const [dtdcOpen, setDtdcOpen] = useState(false);
  const [delhiveryOpen, setDelhiveryOpen] = useState(false);
  const [xpressOpen, setXpressOpen] = useState(false);

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
        h-screen fixed left-0 top-0 z-40 bg-white border-r shadow-sm 
        transition-all duration-200 flex flex-col
        ${isExpanded ? SIDEBAR_WIDE : SIDEBAR_NARROW}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b">
        {isExpanded && <span className="text-lg font-semibold">Admin</span>}

        <button
          onClick={() => setSidebarOpen((s) => !s)}
          aria-label="Toggle sidebar"
          className="p-2 rounded hover:bg-gray-100"
        >
          <Menu size={20} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
        <SidebarItem
          href="/admin"
          label="Dashboard"
          active={pathname === "/admin"}
          icon={<Home size={18} />}
          isExpanded={isExpanded}
        />

        {isExpanded && (
          <div className="text-xs text-gray-400 px-3 uppercase">Providers</div>
        )}

        <SidebarSection
          title="DTDC"
          icon={<Package size={18} className="text-blue-600" />}
          open={dtdcOpen}
          toggle={() => setDtdcOpen(!dtdcOpen)}
          isExpanded={isExpanded}
        >
          <SidebarLink
            href="/admin/dtdc/track"
            label="Track Consignment"
            icon={<Search size={17} />}
            active={pathname.startsWith("/admin/dtdc/track")}
            isExpanded={isExpanded}
          />
          <SidebarLink
            href="/admin/dtdc/pincode"
            label="Pincode Serviceability"
            icon={<MapPin size={17} />}
            active={pathname.startsWith("/admin/dtdc/pincode")}
            isExpanded={isExpanded}
          />
          <SidebarLink
            href="/admin/dtdc/label"
            label="Generate Label"
            icon={<FileText size={17} />}
            isExpanded={isExpanded}
          />
        </SidebarSection>

        <SidebarSection
          title="Delhivery"
          icon={<Truck size={18} className="text-orange-500" />}
          open={delhiveryOpen}
          toggle={() => setDelhiveryOpen(!delhiveryOpen)}
          isExpanded={isExpanded}
        >
          <SidebarLink
            href="/admin/delhivery/track"
            label="Track Consignment"
            icon={<Search size={17} />}
            isExpanded={isExpanded}
          />
          <SidebarLink
            href="/admin/delhivery/pincode"
            label="Pincode Serviceability"
            icon={<MapPin size={17} />}
            isExpanded={isExpanded}
          />
        </SidebarSection>

        <SidebarSection
          title="XpressBees"
          icon={<Truck size={18} className="text-yellow-500" />}
          open={xpressOpen}
          toggle={() => setXpressOpen(!xpressOpen)}
          isExpanded={isExpanded}
        >
          <SidebarLink
            href="/admin/xpress/track"
            label="Track Consignment"
            icon={<Search size={17} />}
            isExpanded={isExpanded}
          />
        </SidebarSection>

        <SidebarItem
          href="/admin/dtdc/clients"
          label="Clients"
          icon={<Users size={17} />}
          active={pathname.startsWith("/admin/dtdc/clients")}
          isExpanded={isExpanded}
        />

        <SidebarItem
          href="/admin/providers"
          label="Providers Setup"
          icon={<Truck size={17} />}
          active={pathname.startsWith("/admin/providers")}
          isExpanded={isExpanded}
        />

        {isExpanded && (
          <div className="text-xs text-gray-400 px-3 uppercase">Billing & Finance</div>
        )}

        <SidebarItem
          href="/admin/billing"
          label="Billing Overview"
          icon={<Layers size={17} />}
          active={pathname.startsWith("/admin/billing")}
          isExpanded={isExpanded}
        />

        <SidebarItem
          href="/admin/billing/invoices"
          label="Invoices"
          icon={<FileText size={17} />}
          active={pathname.startsWith("/admin/billing/invoices")}
          isExpanded={isExpanded}
        />

        <SidebarItem
          href="/admin/finance"
          label="Finance Reports"
          icon={<Package size={17} />}
          active={pathname.startsWith("/admin/finance")}
          isExpanded={isExpanded}
        />

        <SidebarItem
          href="/admin/payments"
          label="Payments"
          icon={<MapPin size={17} />}
          active={pathname.startsWith("/admin/payments")}
          isExpanded={isExpanded}
        />


        {/* ==================================== */}
        {/* COMPLAINTS SECTION                   */}
        {/* ==================================== */}
        {isExpanded && (
          <div className="text-xs text-gray-400 px-3 uppercase mt-4">Complaints</div>
        )}

        <SidebarItem
          href="/admin/complaints"
          label="All Complaints"
          icon={<Search size={17} />}
          active={pathname.startsWith("/admin/complaints")}
          isExpanded={isExpanded}
        />

        <SidebarItem
          href="/admin/complaints?status=open"
          label="Open"
          icon={<Search size={17} />}
          active={pathname.includes("status=open")}
          isExpanded={isExpanded}
        />

        <SidebarItem
          href="/admin/complaints?status=in_progress"
          label="In Progress"
          icon={<Search size={17} />}
          active={pathname.includes("status=in_progress")}
          isExpanded={isExpanded}
        />

        <SidebarItem
          href="/admin/complaints?status=resolved"
          label="Resolved"
          icon={<Search size={17} />}
          active={pathname.includes("status=resolved")}
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

      <div className="border-t px-4 py-4 mt-auto">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded text-red-600 hover:bg-red-50"
        >
          <LogOut size={20} />
          {isExpanded && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

/* Components */

function SidebarSection({ title, icon, open, toggle, isExpanded, children }: any) {
  return (
    <div>
      <button
        onClick={toggle}
        className="flex items-center justify-between w-full px-3 py-2 rounded hover:bg-gray-100"
      >
        <div className="flex items-center gap-3">
          {icon}
          {isExpanded && <span className="font-medium">{title}</span>}
        </div>

        {isExpanded &&
          (open ? <ChevronDown size={17} /> : <ChevronRight size={17} />)}
      </button>

      {open && isExpanded && (
        <div className="mt-1 space-y-1 ml-3 border-l pl-4">{children}</div>
      )}
    </div>
  );
}

function SidebarLink({ href, label, icon, active, isExpanded }: any) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded transition ${
        active
          ? "bg-blue-50 text-blue-600 font-medium"
          : "text-gray-700 hover:bg-gray-100"
      }`}
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
      className={`flex items-center gap-3 px-3 py-2 rounded transition ${
        active
          ? "bg-blue-50 text-blue-600 font-medium"
          : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      {icon}
      {isExpanded && <span>{label}</span>}
    </Link>
  );
}