"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ClientForm = {
  username: string;
  email: string;
  company_name: string;
  password: string;
  providers: string[];
};

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
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-semibold">Add Client</h1>

      <input
        className="border p-2 w-full rounded"
        placeholder="Company Name"
        value={form.company_name}
        onChange={(e) => setForm({ ...form, company_name: e.target.value })}
      />

      <input
        className="border p-2 w-full rounded"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />

      <input
        className="border p-2 w-full rounded"
        placeholder="Username"
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
      />

      <input
        className="border p-2 w-full rounded"
        placeholder="Password"
        type="password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />

      <div>
        <p className="font-semibold mb-2">Allowed Providers</p>

        {["dtdc", "delhivery", "xpressbees"].map((p) => (
          <label className="flex items-center gap-2" key={p}>
            <input
              type="checkbox"
              checked={form.providers.includes(p)}
              onChange={() => toggleProvider(p)}
            />
            {p.toUpperCase()}
          </label>
        ))}
      </div>

      <button
        className="px-4 py-2 bg-black text-white rounded"
        onClick={submit}
        disabled={loading}
      >
        {loading ? "Saving..." : "Save Client"}
      </button>
    </div>
  );
}
