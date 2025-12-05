import CredentialsForm from "./CredentialsForm";

export default async function Page(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return <CredentialsForm id={id} />;
}