"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ClientFormState } from "@/interface/ClientFormState"

export default function EditClientForm({ id }: { id: string }) {
  const router = useRouter();

  const [form, setForm] = useState<ClientFormState>({
    id: 0,
    username: "",
    email: "",
    password_hash: "",
    role: "",
    company_name: "",
    company_address: "",
    contact_person: "",
    phone: "",
    providers: [],
    is_active: true,
    });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/clients/${id}`);
      const json = await res.json();

      if (!json.ok) {
        alert("Failed to load client");
        return;
      }

      setForm({
        ...json.client,
        providers: Array.isArray(json.client.providers)
          ? json.client.providers
          : [],
      });

      setLoading(false);
    }

    load();
  }, [id]);

  async function save() {
    const res = await fetch(`/api/admin/clients/${id}`, {
      method: "PUT",
      body: JSON.stringify(form),
      headers: { "Content-Type": "application/json" },
    });

    const json = await res.json();

    if (json.ok) router.push("/admin/dtdc");
    else alert(json.error);
  }

  if (loading || !form) return <div>Loading...</div>;

  function toggleProvider(p: string) {
    setForm({
      ...form,
      providers: form.providers.includes(p)
        ? form.providers.filter((x: string) => x !== p)
        : [...form.providers, p],
    });
  }

  return (
    <div className="max-w-xl space-y-6 p-6 bg-white shadow rounded-lg">
      <h1 className="text-2xl font-semibold">Edit Client</h1>

      {/* Company Name */}
      <div className="space-y-1">
        <label className="text-sm font-semibold">Company Name</label>
        <input
          className="border p-2 rounded w-full focus:ring focus:ring-blue-200"
          value={form.company_name}
          onChange={(e) => setForm({ ...form, company_name: e.target.value })}
        />
      </div>

      {/* Email */}
      <div className="space-y-1">
        <label className="text-sm font-semibold">Email</label>
        <input
          className="border p-2 rounded w-full focus:ring focus:ring-blue-200"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>

      {/* Providers */}
      <div className="space-y-2">
        <p className="text-sm font-semibold">Allowed Providers</p>

        <div className="bg-gray-50 p-3 rounded border space-y-2">

          {["dtdc", "delhivery", "xpressbees"].map((p) => (
            <label
              key={p}
              className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded"
            >
              <input
                type="checkbox"
                checked={form.providers.includes(p)}
                onChange={() => toggleProvider(p)}
              />

              <span className="font-medium">{p.toUpperCase()}</span>
            </label>
          ))}

        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={save}
        className="w-full py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-900"
      >
        Save Changes
      </button>
    </div>
  );
}
