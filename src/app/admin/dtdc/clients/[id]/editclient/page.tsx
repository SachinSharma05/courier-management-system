import EditClientForm from "./EditClientForm";

export default async function Page(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  return <EditClientForm id={id} />;
}