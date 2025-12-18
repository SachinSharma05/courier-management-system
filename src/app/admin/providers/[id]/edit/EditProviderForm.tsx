"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function EditProviderForm({ id }: { id: string }) {
  const router = useRouter();

  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/providers/${id}`);
      const json = await res.json();
      setForm(json.provider);
    }
    load();
  }, [id]);

  if (!form) return <div>Loading…</div>;

  async function save() {
    const res = await fetch(`/api/admin/providers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const json = await res.json();
    if (json.ok) router.push("/admin/providers");
    else alert(json.error);
  }

  return (
    <div className="max-w-xl space-y-6 p-6 bg-white shadow rounded-lg">
      <h1 className="text-2xl font-semibold">Edit Provider</h1>

      <div className="space-y-1">
        <label className="text-sm font-semibold">Provider Name</label>
        <input
          className="border p-2 rounded w-full focus:ring focus:ring-blue-200"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-semibold">Provider Key</label>
        <input
          className="border p-2 rounded w-full focus:ring focus:ring-blue-200"
          value={form.key}
          onChange={(e) => setForm({ ...form, key: e.target.value })}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-semibold">Description</label>
        <textarea
          className="border p-2 rounded w-full focus:ring focus:ring-blue-200"
          rows={3}
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
        />
      </div>

      <div className = "space-y-1">
        <label className="text-sm font-semibold">Active Status</label>
        <select 
          className="border p-2 rounded w-full focus:ring focus:ring-blue-200">
          <option value="true" selected={form.is_active} onChange={(e) => setForm({ ...form, is_active: true })}>Active</option>
          <option value="false" selected={!form.is_active} onChange={(e) => setForm({ ...form, is_active: false })}>Inactive</option>
          </select>
      </div>

      <button
        onClick={save}
        className="w-full px-4 py-2 bg-black text-white rounded hover:bg-gray-900"
      >
        Save Changes
      </button>
    </div>
  );
}
