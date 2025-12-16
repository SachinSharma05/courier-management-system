"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClientForm } from "@/interface/ClientForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AddClientForm({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const json = await res.json();
    setLoading(false);

    if (!json.ok) {
      alert(json.error);
      return;
    }

    onSuccess?.(); // ✅ close modal + refresh
  }

  function toggleProvider(key: string) {
    setForm((f) => ({
      ...f,
      providers: f.providers.includes(key)
        ? f.providers.filter((p) => p !== key)
        : [...f.providers, key],
    }));
  }

  return (
    <div className="space-y-6">

      {/* Company */}
      <div>
        <label className="text-sm font-medium">Company Name</label>
        <input
          className="border p-2 rounded w-full"
          value={form.company_name}
          onChange={(e) =>
            setForm({ ...form, company_name: e.target.value })
          }
        />
      </div>

      {/* Email */}
      <div>
        <label className="text-sm font-medium">Email</label>
        <input
          type="email"
          className="border p-2 rounded w-full"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>

      {/* Username */}
      <div>
        <label className="text-sm font-medium">Username</label>
        <input
          className="border p-2 rounded w-full"
          value={form.username}
          onChange={(e) =>
            setForm({ ...form, username: e.target.value })
          }
        />
      </div>

      {/* Password */}
      <div>
        <label className="text-sm font-medium">Password</label>
        <input
          type="password"
          className="border p-2 rounded w-full"
          value={form.password}
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
        />
      </div>

      {/* Providers */}
      <div>
        <p className="text-sm font-semibold mb-2">Allowed Providers</p>
        <div className="grid grid-cols-2 gap-3">
          {["dtdc", "delhivery", "xpressbees"].map((p) => (
            <label key={p} className="flex gap-2 items-center border p-2 rounded">
              <input
                type="checkbox"
                checked={form.providers.includes(p)}
                onChange={() => toggleProvider(p)}
              />
              {p.toUpperCase()}
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={submit}
          disabled={loading}
          className="px-4 py-2 bg-black text-white rounded"
        >
          {loading ? "Saving..." : "Save Client"}
        </button>
      </div>
    </div>
  );
}