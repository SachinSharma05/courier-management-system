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

    if (json.ok) router.push("/admin/clients");
    else alert(json.error);
  }

  return (
    <div className="max-w-xl space-y-6 p-6 bg-white shadow rounded-lg">
      <h1 className="text-2xl font-semibold">API Credentials</h1>

      {/* PROVIDER SELECT */}
      <div>
        <label className="block text-sm font-semibold mb-1">Provider</label>

        <Select
          value={selectedProvider ? String(selectedProvider) : "none"}
          onValueChange={(v) => {
            if (v === "none") setSelectedProvider(null);
            else setSelectedProvider(Number(v));
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="-- Select Provider --" />
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

      {/** ---------------------------------------------------------------- **/}
      {/** ADD CUSTOMER CODE FIELD (ALWAYS SHOWN, SAVED AS env_key = DTDC_CUSTOMER_CODE) **/}
      {/** ---------------------------------------------------------------- **/}

      <div>
        <label className="block text-sm font-semibold mb-1">
          DTDC_CUSTOMER_CODE
        </label>

        <input
          type="text"
          className="border p-2 rounded w-full"
          value={creds["DTDC_CUSTOMER_CODE"] ?? ""}
          onChange={(e) =>
            setCreds({ ...creds, DTDC_CUSTOMER_CODE: e.target.value })
          }
        />
      </div>

      {/** ---------------------------------------------------------------- **/}
      {/** EXISTING CREDENTIAL FIELDS (UNCHANGED)                          **/}
      {/** ---------------------------------------------------------------- **/}

      {(Object.keys(creds) as (keyof CredentialFormState)[]).map((key) => {
        if (key === "DTDC_CUSTOMER_CODE") return null;

        return (
            <div key={key}>
            <label className="block text-sm font-semibold mb-1 flex justify-between">
                {key}

                {(key === "password" || key === "api_key" || key === "api_token") && (
                <button
                    type="button"
                    className="text-xs underline"
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
                type={masked[key] ? "password" : "text"}
                className="border p-2 rounded w-full"
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

      <button
        onClick={save}
        className="px-4 py-2 bg-black text-white rounded hover:bg-gray-900"
      >
        Save
      </button>
    </div>
  );
}