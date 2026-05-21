"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";

const links = [
  { href: "/admin", label: "Prehľad", icon: "dashboard" },
  { href: "/admin/produkty", label: "Produkty", icon: "box" },
  { href: "/admin/skladom", label: "Sklad", icon: "stack" },
  { href: "/admin/promo", label: "Promo kódy", icon: "tag" },
  { href: "/admin/objednavky", label: "Objednávky", icon: "cart" },
  { href: "/admin/tlac", label: "Tlač na mieru", icon: "printer" },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 flex-shrink-0 border-r border-neutral-200 bg-white md:block">
      <div className="border-b border-neutral-200 px-5 py-5">
        <Logo href="/admin" size="sm" />
        <p className="mt-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
          Admin panel
        </p>
      </div>
      <nav className="p-3">
        {links.map((link) => {
          const active =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname?.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-brand/10 text-brand"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <Icon name={link.icon} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-3 pb-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-100"
        >
          <Icon name="home" />
          <span>Pozrieť e-shop</span>
        </Link>
      </div>
    </aside>
  );
}

function Icon({ name }: { name: string }) {
  const props = {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-4 w-4",
  };
  switch (name) {
    case "dashboard":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      );
    case "box":
      return (
        <svg {...props}>
          <path d="M21 8 12 3 3 8l9 5 9-5z" />
          <path d="M3 8v8l9 5 9-5V8" />
          <path d="M12 13v8" />
        </svg>
      );
    case "stack":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="18" height="6" rx="1" />
          <rect x="3" y="11" width="18" height="6" rx="1" />
          <path d="M5 19h14" />
        </svg>
      );
    case "cart":
      return (
        <svg {...props}>
          <circle cx="9" cy="20" r="1.5" />
          <circle cx="18" cy="20" r="1.5" />
          <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 7H6" />
        </svg>
      );
    case "printer":
      return (
        <svg {...props}>
          <path d="M6 9V3h12v6" />
          <rect x="3" y="9" width="18" height="9" rx="2" />
          <rect x="6" y="14" width="12" height="7" rx="1" />
        </svg>
      );
    case "tag":
      return (
        <svg {...props}>
          <path d="M12 2H2v10l9.3 9.3a1 1 0 0 0 1.4 0l9.3-9.3V2H12z" />
          <circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case "home":
      return (
        <svg {...props}>
          <path d="m3 11 9-8 9 8" />
          <path d="M5 10v10h14V10" />
        </svg>
      );
    default:
      return null;
  }
}
