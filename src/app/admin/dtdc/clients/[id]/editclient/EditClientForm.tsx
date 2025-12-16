"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ClientFormState } from "@/interface/ClientFormState"

export default function EditClientForm({
  id,
  onSuccess,
}: {
  id: string;
  onSuccess?: () => void;
}) {
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const json = await res.json();

    if (!json.ok) {
      alert(json.error);
      return;
    }

    onSuccess?.(); // ✅ close modal / refresh parent
  }

  if (loading) return <div>Loading...</div>;

  function toggleProvider(p: string) {
    setForm({
      ...form,
      providers: form.providers.includes(p)
        ? form.providers.filter((x) => x !== p)
        : [...form.providers, p],
    });
  }

  return (
    <div className="space-y-6">
      {/* Company Name */}
      <div>
        <label className="text-sm font-semibold">Company Name</label>
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
        <label className="text-sm font-semibold">Email</label>
        <input
          className="border p-2 rounded w-full"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>

      {/* Providers */}
      <div>
        <p className="text-sm font-semibold mb-2">Allowed Providers</p>
        <div className="space-y-2 bg-gray-50 p-3 rounded border">
          {["dtdc", "delhivery", "xpressbees"].map((p) => (
            <label key={p} className="flex gap-2 items-center">
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

      <button
        onClick={save}
        className="w-full py-2 bg-black text-white rounded-lg"
      >
        Save Changes
      </button>
    </div>
  );
}
