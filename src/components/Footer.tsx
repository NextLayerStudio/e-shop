import Link from "next/link";
import { Logo } from "./Logo";

const quickLinks = [
  { href: "/", label: "Domov" },
  { href: "/produkty", label: "Produkty" },
  { href: "/tlac-na-mieru", label: "Tlač na mieru" },
];

const cookieLinks = [
  { href: "/cookies", label: "Cookies" },
  { href: "/gdpr/cookies", label: "GDPR" },
];

const infoLinks = [
  { href: "/obchodne-podmienky", label: "Obchodné podmienky" },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-neutral-200 bg-neutral-100">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
          <div className="md:col-span-1">
            <Logo size="lg" />
          </div>

          <FooterColumn title="Rýchle odkazy" links={quickLinks} />
          <FooterColumn title="Cookies & GDPR" links={cookieLinks} />
          <FooterColumn title="Informácie" links={infoLinks} />

          <div>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">Kontakt</h3>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li>
                <span className="text-neutral-400">mail: </span>
                <a
                  href="mailto:know3d.know3d@gmail.com"
                  className="hover:text-brand"
                >
                  know3d.know3d@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t-2 border-brand/30 pt-4 text-center text-xs text-neutral-500">
          © {new Date().getFullYear()} iknow3D s.r.o. Všetky práva vyhradené.
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-neutral-900">{title}</h3>
      <ul className="space-y-2 text-sm text-neutral-600">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="hover:text-brand">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
