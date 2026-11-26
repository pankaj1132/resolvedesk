import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { googleEnabled } from "@/lib/auth";
import { getSession } from "@/lib/session";

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getSession()) redirect("/dashboard");
  const params = await searchParams;
  return <AuthForm mode="login" googleEnabled={googleEnabled} googleError={Boolean(params.error)} />;
}
