import EditProviderForm from "./EditProviderForm";

export default async function Page(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;   // IMPORTANT FIX

  return <EditProviderForm id={id} />;
}