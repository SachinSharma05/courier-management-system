import ClientDetailPage from "./ClientDetailPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // ✅ unwrap the promise

  return <ClientDetailPage id={id} />;
}