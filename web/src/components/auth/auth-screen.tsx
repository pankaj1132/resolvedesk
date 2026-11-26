import Link from "next/link";
import { redirect } from "next/navigation";
import { ResolveDeskBrand } from "@/components/resolve-desk-brand";
import { EmailAuthForm } from "@/components/auth/email-auth-form";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { googleSignInEnabled } from "@/lib/auth";
import { authHref, getAuthDestination } from "@/lib/auth-destination";
import { getSession } from "@/lib/session";

type AuthScreenProps = {
  mode: "login" | "signup";
  searchParams: Promise<{ error?: string | string[]; next?: string | string[] }>;
};

function googleErrorMessage(error: string) {
  if (error === "access_denied") {
    return "Google sign-in was canceled. You can try again.";
  }

  if (error === "account_not_linked") {
    return "This email already uses another sign-in method. Sign in with that method to continue.";
  }

  return "Google sign-in could not finish. Please try again.";
}

export async function AuthScreen({ mode, searchParams }: AuthScreenProps) {
  const { error, next } = await searchParams;
  const destination = getAuthDestination(next);
  if (await getSession()) {
    redirect(destination);
  }

  const isSignup = mode === "signup";

  return (
    <main className="auth-shell">
      <ResolveDeskBrand />
      <section className="account-card" aria-labelledby="auth-heading">
        <h1 id="auth-heading" className="text-3xl font-semibold tracking-tight">
          {isSignup ? "Create your account" : "Sign in to ResolveDesk"}
        </h1>
        <div className="mt-6 grid gap-5">
          <EmailAuthForm mode={mode} destination={destination} />
          {googleSignInEnabled ? (
            <div className="grid gap-3">
              <div className="auth-divider">or</div>
              <GoogleSignInButton
                destination={destination}
                errorPath={authHref(isSignup ? "/signup" : "/login", destination)}
              />
              {typeof error === "string" && (
                <p className="form-error" role="alert">{googleErrorMessage(error)}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">Google sign-in is currently unavailable.</p>
          )}
        </div>
        <p className="mt-6 text-sm text-[var(--muted)]">
          {isSignup ? "Already have an account?" : "New to ResolveDesk?"}{" "}
          <Link className="auth-link" href={authHref(isSignup ? "/login" : "/signup", destination)}>
            {isSignup ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </section>
    </main>
  );
}
