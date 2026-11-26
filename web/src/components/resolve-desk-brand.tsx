import Link from "next/link";

export function ResolveDeskBrand() {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 rounded-md font-bold tracking-tight">
      <span aria-hidden="true" className="brand-mark">R</span>
      ResolveDesk
    </Link>
  );
}
