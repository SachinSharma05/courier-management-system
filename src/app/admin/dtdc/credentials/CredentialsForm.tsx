"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CredentialFormState } from "@/interface/CredentialFormState";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type ProviderItem = { id: number; name: string };

export default function CredentialsForm({ id }: { id: string }) {
  const router = useRouter();

  const [creds, setCreds] = useState<CredentialFormState>({
    id: 0,                // add this
    client_id: Number(id),
    provider_id: 0,
    DTDC_CUSTOMER_CODE: "",
    api_key: "",
    api_token: "",
    password: "",
    });

  const [masked, setMasked] = useState<{ [key: string]: boolean }>({});
  const [selectedProvider, setSelectedProvider] = useState<number | null>(null);

  const { data: providersData } = useSWR("/api/admin/providers", fetcher);
  const providers: ProviderItem[] = providersData?.providers ?? [];

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/clients/${id}/credentials`);
      const json = await res.json();

      if (!json.ok) {
        alert(json.error);
        return;
      }

      // Load stored credentials
      setCreds(json.credentials);

      // Mask sensitive fields
      setMasked({
        password: true,
        api_token: true,
        api_key: true,
      });
    }

    load();
  }, [id]);

  if (!creds) return <div className="p-6">Loading credentials…</div>;

  async function save() {
    if (!selectedProvider) {
      alert("Please select provider");
      return;
    }

    const res = await fetch(`/api/admin/clients/${id}/credentials`, {
      method: "PUT",
      body: JSON.stringify({
        providerId: selectedProvider,
        ...creds, // ALL fields go here INCLUDING DTDC_CUSTOMER_CODE
      }),
    });

    const json = await res.json();

    if (json.ok) router.push("/admin/dtdc/clients");
    else alert(json.error);
  }

  return (
  <div className="max-w-2xl mx-auto p-6">
    
    {/* HEADER */}
    <div className="mb-6">
      <h1 className="text-3xl font-bold tracking-tight">API Credentials</h1>
      <p className="text-gray-500 mt-1">
        Configure authentication details for selected provider.
      </p>
    </div>

    {/* MAIN CARD */}
    <div className="bg-white border rounded-xl shadow-sm p-6 space-y-6">

      {/* PROVIDER SELECT */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Provider</label>

        <Select
          value={selectedProvider ? String(selectedProvider) : "none"}
          onValueChange={(v) => {
            if (v === "none") setSelectedProvider(null);
            else setSelectedProvider(Number(v));
          }}
        >
          <SelectTrigger className="w-full md:w-60">
            <SelectValue placeholder="Select Provider" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="none">-- Select Provider --</SelectItem>
            {providers.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* CUSTOMER CODE (ALWAYS SHOW) */}
      <div className="space-y-1">
        <label className="text-sm font-medium">DTDC Customer Code</label>
        <input
          type="text"
          className="w-full px-3 py-2 rounded-lg border bg-white text-sm 
                     focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={creds["DTDC_CUSTOMER_CODE"] ?? ""}
          onChange={(e) =>
            setCreds({ ...creds, DTDC_CUSTOMER_CODE: e.target.value })
          }
        />
      </div>

      {/* DYNAMIC CREDENTIAL FIELDS */}
      {(Object.keys(creds) as (keyof CredentialFormState)[]).map((key) => {
        if (key === "DTDC_CUSTOMER_CODE") return null;

        const isSecret =
          key === "password" || key === "api_key" || key === "api_token";

        return (
          <div key={key} className="space-y-1">
            <label className="text-sm font-medium flex justify-between items-center">
              {key}
              {isSecret && (
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:underline"
                  onClick={() =>
                    setMasked((m) => ({
                      ...m,
                      [key]: !m[key],
                    }))
                  }
                >
                  {masked[key] ? "Show" : "Hide"}
                </button>
              )}
            </label>

            <input
              type={isSecret && masked[key] ? "password" : "text"}
              className="w-full px-3 py-2 rounded-lg border bg-white text-sm 
                         focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={creds[key] ?? ""}
              onChange={(e) =>
                setCreds({
                  ...creds,
                  [key]: e.target.value,
                })
              }
            />
          </div>
        );
      })}

      {/* SAVE BUTTON */}
      <div className="pt-2">
        <button
          onClick={save}
          className="px-5 py-2.5 rounded-lg bg-black text-white shadow 
                     hover:bg-gray-900 transition disabled:opacity-50"
        >
          Save
        </button>
      </div>

    </div>
  </div>
);
}