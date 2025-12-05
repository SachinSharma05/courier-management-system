"use client";

import { useState } from "react";
import Sidebar from "@/components/admin/Sidebar";

const SIDEBAR_WIDE = "ml-60";
const SIDEBAR_NARROW = "ml-16";

export default function AdminLayoutClient({ children }: { children : React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen flex">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main
        className={`flex-1 transition-all p-6 bg-gray-50 min-h-screen ${
          sidebarOpen ? SIDEBAR_WIDE : SIDEBAR_NARROW
        }`}
      >
        {children}
      </main>
    </div>
  );
}