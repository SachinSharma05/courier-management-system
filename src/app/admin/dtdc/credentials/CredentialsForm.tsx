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

export default function CredentialsForm({
  id,
  onSuccess,
}: {
  id: string;
  onSuccess?: () => void;
}) {
  const [creds, setCreds] = useState<CredentialFormState>({
    id: 0,
    client_id: Number(id),
    provider_id: 0,
    DTDC_CUSTOMER_CODE: "",
    api_key: "",
    api_token: "",
    password: "",
  });

  const [masked, setMasked] = useState<{ [k: string]: boolean }>({});
  const [selectedProvider, setSelectedProvider] = useState<number | null>(null);

  const { data } = useSWR("/api/admin/providers", fetcher);
  const providers: ProviderItem[] = data?.providers ?? [];

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/clients/${id}/credentials`);
      const json = await res.json();

      if (!json.ok) {
        alert(json.error);
        return;
      }

      setCreds(json.credentials);
      setMasked({ password: true, api_key: true, api_token: true });
    }

    load();
  }, [id]);

  async function save() {
    if (!selectedProvider) {
      alert("Please select provider");
      return;
    }

    const res = await fetch(`/api/admin/clients/${id}/credentials`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerId: selectedProvider,
        ...creds,
      }),
    });

    const json = await res.json();

    if (!json.ok) {
      alert(json.error);
      return;
    }

    onSuccess?.(); // ✅ close modal / refresh
  }

  return (
    <div className="space-y-6">

      {/* Provider */}
      <div>
        <label className="text-sm font-medium">Provider</label>
        <Select
          value={selectedProvider ? String(selectedProvider) : "none"}
          onValueChange={(v) =>
            setSelectedProvider(v === "none" ? null : Number(v))
          }
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select Provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">-- Select --</SelectItem>
            {providers.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Customer Code */}
      <div>
        <label className="text-sm font-medium">DTDC Customer Code</label>
        <input
          className="border p-2 rounded w-full"
          value={creds.DTDC_CUSTOMER_CODE}
          onChange={(e) =>
            setCreds({ ...creds, DTDC_CUSTOMER_CODE: e.target.value })
          }
        />
      </div>

      {/* Dynamic fields */}
      {(Object.keys(creds) as (keyof CredentialFormState)[]).map((key) => {
        if (key === "DTDC_CUSTOMER_CODE") return null;

        const secret = ["password", "api_key", "api_token"].includes(key);

        return (
          <div key={key}>
            <label className="text-sm font-medium flex justify-between">
              {key}
              {secret && (
                <button
                  type="button"
                  className="text-xs text-blue-600"
                  onClick={() =>
                    setMasked((m) => ({ ...m, [key]: !m[key] }))
                  }
                >
                  {masked[key] ? "Show" : "Hide"}
                </button>
              )}
            </label>

            <input
              type={secret && masked[key] ? "password" : "text"}
              className="border p-2 rounded w-full"
              value={creds[key] ?? ""}
              onChange={(e) =>
                setCreds({ ...creds, [key]: e.target.value })
              }
            />
          </div>
        );
      })}

      <button
        onClick={save}
        className="w-full py-2 bg-black text-white rounded-lg"
      >
        Save
      </button>
    </div>
  );
}