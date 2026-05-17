"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV_LINKS = [
  { href: "/", label: "Domov" },
  { href: "/produkty", label: "Produkty" },
  { href: "/tlac-na-mieru", label: "Tlač na mieru" },
] as const;

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavbarNavLinks({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <>
      {NAV_LINKS.map((link) => {
        const active = isNavActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-1.5 text-sm font-medium transition-colors hover:text-brand ${
              active
                ? "rounded-full bg-brand/12 text-brand-dark"
                : "text-neutral-700"
            } ${className ?? ""}`}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}
