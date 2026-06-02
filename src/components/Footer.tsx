import Link from "next/link";
import type { ReactNode } from "react";
import { LEGAL_ENTITY_NAME } from "@/lib/brand";
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

const contactItems = [
  { icon: "user", text: "Karolína Nováková" },
  {
    icon: "location",
    text: "Haburská 84/9, 821 01 Bratislava – mestská časť Ružinov",
  },
  {
    icon: "mail",
    text: "know3d.know3d@gmail.com",
    href: "mailto:know3d.know3d@gmail.com",
  },
  { icon: "id", text: "IČO: 57514097" },
  { icon: "id", text: "DIČ: 2122789163" },
] as const;

export function Footer() {
  return (
    <footer className="mt-20 border-t border-neutral-200 bg-neutral-100">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-0">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-start sm:gap-16 lg:gap-24 lg:pr-8">
            <Logo size="lg" className="shrink-0" />
            <FooterColumn title="Rýchle odkazy" links={quickLinks} />
          </div>

          <div className="border-y border-neutral-200 py-8 lg:border-x lg:border-y-0 lg:px-8 lg:py-0">
            <FooterContact />
          </div>

          <div className="flex w-full justify-start lg:justify-end">
            <div className="lg:mr-24">
              <FooterColumn title="Cookies & GDPR" links={cookieLinks} />
              <div className="mt-6">
                <FooterColumn title="Informácie" links={infoLinks} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t-2 border-brand/30 pt-4 text-center text-xs text-neutral-500">
          © {new Date().getFullYear()} {LEGAL_ENTITY_NAME} Všetky práva vyhradené.
        </div>
      </div>
    </footer>
  );
}

function FooterContact() {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center text-center">
      <h3 className="text-base font-semibold text-neutral-900">Kontakt</h3>

      <ul className="mt-5 w-full space-y-3">
        {contactItems.map((item) => (
          <li key={item.text}>
            <ContactRow icon={item.icon} href={"href" in item ? item.href : undefined}>
              {item.text}
            </ContactRow>
          </li>
        ))}
      </ul>

      <div className="mt-6 space-y-1 text-xs leading-relaxed text-neutral-500">
        <p>Zapísaný v Obchodnom registri Mestského súdu Bratislava III</p>
        <p>oddiel: Sro</p>
        <p>vložka č. 197405/B</p>
      </div>
    </div>
  );
}

function ContactRow({
  icon,
  href,
  children,
}: {
  icon: (typeof contactItems)[number]["icon"];
  href?: string;
  children: ReactNode;
}) {
  const content = (
    <>
      <ContactIcon name={icon} />
      <span className="text-left text-sm text-neutral-600">{children}</span>
    </>
  );

  const alignStart = icon === "location";

  return (
    <div className="flex justify-center">
      {href ? (
        <a
          href={href}
          className={`inline-flex gap-2.5 hover:text-brand ${alignStart ? "items-start" : "items-center"}`}
        >
          {content}
        </a>
      ) : (
        <div
          className={`inline-flex gap-2.5 ${alignStart ? "items-start" : "items-center"}`}
        >
          {content}
        </div>
      )}
    </div>
  );
}

function ContactIcon({ name }: { name: (typeof contactItems)[number]["icon"] }) {
  const className = "h-4 w-4 shrink-0 text-brand";
  switch (name) {
    case "user":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case "location":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" strokeLinecap="round" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case "mail":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeLinecap="round" />
          <path d="m22 6-10 7L2 6" strokeLinecap="round" />
        </svg>
      );
    case "id":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
          <path d="M6 15h4" strokeLinecap="round" />
          <circle cx="16" cy="14" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      );
  }
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
