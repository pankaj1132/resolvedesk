import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { ResolveDeskBrand } from "@/components/resolve-desk-brand";

type TicketShellProps = {
  back: { href: string; label: string };
  children: ReactNode;
};

export function TicketShell({ back, children }: TicketShellProps) {
  return (
    <main className="mx-auto grid w-full max-w-5xl gap-6 px-5 py-8 sm:py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <ResolveDeskBrand />
        <LogoutButton />
      </header>
      <Link className="auth-link w-fit text-sm" href={back.href}>{back.label}</Link>
      {children}
    </main>
  );
}
