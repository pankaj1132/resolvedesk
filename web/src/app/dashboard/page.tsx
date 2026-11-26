import { LogoutButton } from "@/components/logout-button";
import { requireSession } from "@/lib/session";

export default async function DashboardPage() {
  const { user } = await requireSession();
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <span className="text-xl font-bold tracking-tight text-indigo-700">ResolveDesk</span>
          <LogoutButton />
        </header>
        <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-indigo-600">Your account</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Welcome, {user.name}</h1>
          <p className="mt-3 break-all text-slate-600">{user.email}</p>
        </section>
      </div>
    </main>
  );
}
