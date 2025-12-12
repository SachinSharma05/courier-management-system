const BASE = process.env.DELHIVERY_C2C_BASE!;
const TOKEN = process.env.DELHIVERY_C2C_TOKEN!;

export async function delhiveryC2C(path: string, query?: Record<string, string>) {
  const url = new URL(BASE + path);
  if (query) Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));

  const headers = {
    Authorization: `Token ${TOKEN}`,
    "Content-Type": "application/json",
  };

  const res = await fetch(url.toString(), { headers });

  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}