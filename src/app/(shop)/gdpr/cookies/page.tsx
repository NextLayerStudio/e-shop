import Link from "next/link";
import { BRAND_NAME } from "@/lib/brand";
import { COMPANY_CONTACT } from "@/lib/companyContact";

export const metadata = {
  title: "Ochrana osobných údajov (GDPR)",
  description: `Informácie o spracúvaní osobných údajov a cookies na e-shope ${BRAND_NAME}.`,
};

const sections = [
  {
    n: 1,
    title: "Prevádzkovateľ osobných údajov",
    content: (
      <div className="space-y-4 text-neutral-700">
        <p>
          <strong className="text-neutral-900">{COMPANY_CONTACT.legalName}</strong>
        </p>
        <ul className="space-y-2">
          <li>
            <span className="text-neutral-500">Kontaktná osoba: </span>
            {COMPANY_CONTACT.responsiblePerson}
          </li>
          <li>
            <span className="text-neutral-500">Sídlo: </span>
            {COMPANY_CONTACT.address}
          </li>
          <li>
            <span className="text-neutral-500">E-mail: </span>
            <Link
              href={`mailto:${COMPANY_CONTACT.email}`}
              className="font-medium text-brand hover:text-brand-dark"
            >
              {COMPANY_CONTACT.email}
            </Link>
          </li>
          <li>
            <span className="text-neutral-500">IČO: </span>
            {COMPANY_CONTACT.ico}
          </li>
          <li>
            <span className="text-neutral-500">DIČ: </span>
            {COMPANY_CONTACT.dic}
          </li>
        </ul>
        <div className="space-y-1 text-sm text-neutral-600">
          {COMPANY_CONTACT.registryLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
    ),
  },
  {
    n: 2,
    title: "Spracúvané údaje",
    content: (
      <ul className="list-inside list-disc space-y-1.5 text-neutral-700 marker:text-brand">
        <li>meno a priezvisko,</li>
        <li>adresa doručenia,</li>
        <li>email,</li>
        <li>telefón,</li>
        <li>fakturačné údaje.</li>
      </ul>
    ),
  },
  {
    n: 3,
    title: "Účel spracovania",
    content: (
      <ul className="list-inside list-disc space-y-1.5 text-neutral-700 marker:text-brand">
        <li>vybavenie objednávky,</li>
        <li>doručenie tovaru,</li>
        <li>vystavenie faktúry.</li>
      </ul>
    ),
  },
  {
    n: 4,
    title: "Doba uchovávania",
    content: (
      <ul className="list-inside list-disc space-y-1.5 text-neutral-700 marker:text-brand">
        <li>údaje sú uchovávané po dobu potrebnú na splnenie účelu,</li>
        <li>podľa zákonných povinností (napr. účtovníctvo).</li>
      </ul>
    ),
  },
  {
    n: 5,
    title: "Práva dotknutej osoby",
    content: (
      <>
        <p className="mb-3 text-neutral-700">Zákazník má právo:</p>
        <ul className="list-inside list-disc space-y-1.5 text-neutral-700 marker:text-brand">
          <li>prístup k osobným údajom,</li>
          <li>opravu, vymazanie alebo obmedzenie spracovania,</li>
          <li>namietať proti spracovaniu,</li>
          <li>
            podať sťažnosť na Úrad na ochranu osobných údajov Slovenskej
            republiky.
          </li>
        </ul>
      </>
    ),
  },
  {
    n: 6,
    title: "Cookies",
    content: (
      <>
        <p className="mb-4 text-neutral-700">Web používa cookies:</p>
        <div className="space-y-4">
          <CookieBlock
            title="Nevyhnutné cookies"
            text="zabezpečujú základnú funkčnosť webu (napr. nákupný košík, zapamätanie súhlasu s cookies). Tieto cookies nie je možné odmietnuť."
          />
          <CookieBlock
            title="Analytické cookies"
            text="pomáhajú nám porozumieť, ako návštevníci používajú stránku, aby sme ju mohli zlepšovať (napr. anonymné štatistiky návštevnosti)."
          />
          <CookieBlock
            title="Marketingové cookies"
            text="používajú sa na zobrazovanie relevantných reklám na základe vašich záujmov (len ak udelíte súhlas)."
          />
        </div>
        <p className="mt-4 text-sm text-neutral-600">
          Používateľ môže nastavenia cookies zmeniť alebo odmietnuť vo svojom
          prehliadači alebo prostredníctvom lišty súhlasu na našom webe.
        </p>
      </>
    ),
  },
] as const;

function CookieBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4">
      <p className="font-semibold text-neutral-900">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-neutral-600">{text}</p>
    </div>
  );
}

export default function GdprPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
      {/* Hlavička */}
      <header className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200">
        <div className="h-1.5 bg-gradient-to-r from-brand via-brand to-accent" />
        <div className="px-6 py-8 md:px-8 md:py-10">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">
            Právne informácie
          </p>
          <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
            Ochrana osobných údajov{" "}
            <span className="text-brand">(GDPR)</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-600 md:text-base">
            Ako spracúvame vaše osobné údaje pri nákupe a používaní tohto
            e-shopu.
          </p>
        </div>
      </header>

      {/* Sekcie */}
      <div className="mt-8 space-y-4">
        {sections.map(({ n, title, content }) => (
          <section
            key={n}
            className="rounded-2xl bg-white p-6 ring-1 ring-neutral-200 md:p-7"
          >
            <div className="mb-4 flex items-start gap-4">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand-dark">
                {n}
              </span>
              <h2 className="pt-1 text-lg font-semibold text-neutral-900 md:text-xl">
                {title}
              </h2>
            </div>
            <div className="pl-0 text-sm leading-relaxed md:pl-[52px] md:text-base">
              {content}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-neutral-400">
        Posledná aktualizácia: máj 2026
      </p>
    </div>
  );
}
