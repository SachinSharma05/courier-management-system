"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClientForm } from "@/interface/ClientForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AddClientPage() {
  const router = useRouter();

  const [form, setForm] = useState<ClientForm>({
    username: "",
    email: "",
    company_name: "",
    password: "",
    providers: [],
  });

  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    const res = await fetch("/api/admin/clients", {
      method: "POST",
      body: JSON.stringify(form),
    });

    const json = await res.json();
    setLoading(false);

    if (json.ok) router.push("/admin/clients");
    else alert(json.error);
  }

  function toggleProvider(key: string) {
    setForm((f) => {
      const exists = f.providers.includes(key);
      return {
        ...f,
        providers: exists
          ? f.providers.filter((p) => p !== key)
          : [...f.providers, key],
      };
    });
  }

  return (
    <div className="p-6 max-w-2xl space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Client</h1>
        <p className="text-gray-500 mt-1">Create a new client and assign allowed providers.</p>
      </div>

      {/* FORM CARD */}
      <div className="bg-white border rounded-xl shadow-sm p-6 space-y-5">

        {/* Company Name */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Company Name</label>
          <input
            className="w-full px-3 py-2 rounded-lg border bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Enter company name"
            value={form.company_name}
            onChange={(e) => setForm({ ...form, company_name: e.target.value })}
          />
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Email</label>
          <input
            className="w-full px-3 py-2 rounded-lg border bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Enter email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        {/* Username */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Username</label>
          <input
            className="w-full px-3 py-2 rounded-lg border bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Enter username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Password</label>
          <input
            className="w-full px-3 py-2 rounded-lg border bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Enter password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>

        {/* Providers */}
        <div className="space-y-2">
          <p className="text-sm font-semibold">Allowed Providers</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {["dtdc", "delhivery", "xpressbees"].map((p) => (
              <label
                key={p}
                className="
                  flex items-center gap-3 border rounded-lg px-4 py-2 cursor-pointer
                  hover:bg-gray-50 transition
                "
              >
                <input
                  type="checkbox"
                  checked={form.providers.includes(p)}
                  onChange={() => toggleProvider(p)}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium">{p.toUpperCase()}</span>
              </label>
            ))}

          </div>
        </div>

      </div>

      {/* FOOTER BUTTON */}
      <div>
        <button
          onClick={submit}
          disabled={loading}
          className="
            px-5 py-2.5 rounded-lg text-white bg-black shadow 
            hover:bg-gray-900 transition disabled:opacity-50
          "
        >
          {loading ? "Saving..." : "Save Client"}
        </button>
        <Link href="/admin/dtdc/clients">
          <Button 
          variant="outline"
          className="
            px-5 py-2.5 rounded-lg text-black bg-gray shadow
          "
          >
            Cancel
          </Button>
        </Link>
      </div>

    </div>
  );
}