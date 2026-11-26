import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { googleEnabled } from "@/lib/auth";
import { getSession } from "@/lib/session";

export default async function SignupPage() {
  if (await getSession()) redirect("/dashboard");
  return <AuthForm mode="signup" googleEnabled={googleEnabled} />;
}
