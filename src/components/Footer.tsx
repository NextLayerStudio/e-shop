import Link from "next/link";
import { Logo } from "./Logo";

const quickLinks = [
  { href: "/", label: "Domov" },
  { href: "/produkty", label: "Produkty" },
  { href: "/tlac-na-mieru", label: "Tlač na mieru" },
  { href: "/kontakt", label: "Kontakt" },
];

const cookieLinks = [
  { href: "/cookies", label: "Cookies" },
  { href: "/gdpr", label: "GDPR" },
];

const infoLinks = [
  { href: "/obchodne-podmienky", label: "Obchodné podmienky" },
  { href: "/o-firme", label: "Informácie o firme" },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-neutral-200 bg-neutral-100">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
          <div className="md:col-span-1">
            <Logo />
          </div>

          <FooterColumn title="Rýchle odkazy" links={quickLinks} />
          <FooterColumn title="Cookies & GDPR" links={cookieLinks} />
          <FooterColumn title="Informácie" links={infoLinks} />

          <div>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">Kontakt</h3>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li>
                <span className="text-neutral-400">mail: </span>
                <a href="mailto:email@email.com" className="hover:text-brand">
                  email@email.com
                </a>
              </li>
              <li>
                <span className="text-neutral-400">tel: </span>
                <a href="tel:+421902885875" className="hover:text-brand">
                  +421 902 885 875
                </a>
              </li>
              <li className="flex items-center gap-2">
                <SocialIcon kind="instagram" />
                <a
                  href="https://instagram.com/iknow3D"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-brand"
                >
                  @iknow3D
                </a>
              </li>
              <li className="flex items-center gap-2">
                <SocialIcon kind="facebook" />
                <a
                  href="https://facebook.com/iknow3D"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-brand"
                >
                  @iknow3D
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

function SocialIcon({ kind }: { kind: "instagram" | "facebook" }) {
  if (kind === "instagram") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-4 w-4 text-neutral-500"
      >
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4 text-neutral-500"
    >
      <path d="M22 12.07C22 6.5 17.52 2 12 2S2 6.5 2 12.07c0 5 3.66 9.13 8.44 9.93v-7.03h-2.54v-2.9h2.54V9.84c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.9h-2.33V22c4.78-.8 8.44-4.93 8.44-9.93z" />
    </svg>
  );
}
