import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-dark transition-colors ${className}`}
      aria-label="iknow3D – domov"
    >
      Logo
    </Link>
  );
}
