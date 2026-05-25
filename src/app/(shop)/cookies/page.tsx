import Link from "next/link";
import { CookieReopenButton } from "@/components/CookieReopenButton";

export const metadata = {
  title: "Zásady používania cookies",
  description:
    "Aké cookies používa e-shop iknow3D, na čo slúžia a ako si môžete súhlas kedykoľvek zmeniť.",
};

type CookieRow = {
  name: string;
  purpose: string;
  duration: string;
};

const necessaryCookies: CookieRow[] = [
  {
    name: "iknow3d.cookie-consent",
    purpose: "Uchováva vašu voľbu nastavení cookies, aby sme sa vás nepýtali pri každej návšteve.",
    duration: "12 mesiacov (localStorage)",
  },
  {
    name: "cart",
    purpose: "Uchováva obsah nákupného košíka medzi návštevami.",
    duration: "Trvalá (localStorage)",
  },
  {
    name: "admin_session",
    purpose: "Prihlasovacia relácia pre administračné rozhranie.",
    duration: "Trvanie prihlásenia",
  },
];

const sections = [
  {
    n: 1,
    title: "Čo sú cookies",
    content: (
      <p className="text-neutral-700">
        Cookies sú malé textové súbory, ktoré web pri návšteve uloží do vášho
        zariadenia. Pomáhajú zapamätať si vaše voľby (napr. obsah košíka, súhlas
        s cookies) a anonymne nám ukazujú, ako sa stránka používa. Niektoré
        funkcie webu sa bez nich nedajú spustiť.
      </p>
    ),
  },
  {
    n: 2,
    title: "Kategórie cookies, ktoré používame",
    content: (
      <div className="space-y-4">
        <CookieCategory
          title="Nevyhnutné"
          required
          text="Bez týchto cookies e-shop nefunguje — uchovávajú obsah košíka, prihlásenie do administrácie a vašu voľbu cookies. Súhlas sa pre ne nevyžaduje."
        />
        <CookieCategory
          title="Analytické"
          text="Anonymné štatistiky návštevnosti (počet návštevníkov, najčastejšie navštevované stránky, čas strávený na webe). Slúžia výhradne na zlepšovanie obsahu — nikoho na ich základe neidentifikujeme."
        />
        <CookieCategory
          title="Marketingové"
          text="Pomáhajú nám zobrazovať relevantnejšie reklamy mimo nášho webu a merať ich účinnosť. Bez vášho výslovného súhlasu sa neaktivujú."
        />
      </div>
    ),
  },
  {
    n: 3,
    title: "Konkrétne nevyhnutné cookies",
    content: (
      <div className="overflow-x-auto rounded-xl border border-neutral-200">
        <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
          <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-600">
            <tr>
              <th className="px-4 py-3">Názov</th>
              <th className="px-4 py-3">Účel</th>
              <th className="px-4 py-3">Trvanie</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 bg-white">
            {necessaryCookies.map((c) => (
              <tr key={c.name}>
                <td className="px-4 py-3 font-mono text-xs text-neutral-800">
                  {c.name}
                </td>
                <td className="px-4 py-3 text-neutral-700">{c.purpose}</td>
                <td className="px-4 py-3 text-neutral-600">{c.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  },
  {
    n: 4,
    title: "Ako spravovať súhlas",
    content: (
      <>
        <p className="mb-4 text-neutral-700">
          Pri prvej návšteve vám ukážeme lištu, kde si môžete vybrať, čo
          povolíte. Súhlas môžete kedykoľvek zmeniť kliknutím na tlačidlo
          nižšie.
        </p>
        <CookieReopenButton />
        <p className="mt-4 text-sm text-neutral-600">
          Cookies viete vymazať aj priamo v nastaveniach svojho prehliadača
          (napr. Chrome, Firefox, Safari, Edge). V takom prípade však môžu
          niektoré časti webu prestať fungovať správne.
        </p>
      </>
    ),
  },
  {
    n: 5,
    title: "Súvisiace dokumenty",
    content: (
      <ul className="list-inside list-disc space-y-1.5 text-neutral-700 marker:text-brand">
        <li>
          <Link
            href="/gdpr/cookies"
            className="text-brand underline-offset-2 hover:underline"
          >
            Ochrana osobných údajov (GDPR)
          </Link>{" "}
          — ako spracúvame osobné údaje.
        </li>
        <li>
          <Link
            href="/obchodne-podmienky"
            className="text-brand underline-offset-2 hover:underline"
          >
            Obchodné podmienky
          </Link>{" "}
          — podmienky používania e-shopu.
        </li>
      </ul>
    ),
  },
] as const;

function CookieCategory({
  title,
  text,
  required,
}: {
  title: string;
  text: string;
  required?: boolean;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-semibold text-neutral-900">{title}</p>
        {required && (
          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-dark">
            Vždy aktívne
          </span>
        )}
      </div>
      <p className="mt-1 text-sm leading-relaxed text-neutral-600">{text}</p>
    </div>
  );
}

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
      <header className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200">
        <div className="h-1.5 bg-gradient-to-r from-brand via-brand to-accent" />
        <div className="px-6 py-8 md:px-8 md:py-10">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">
            Právne informácie
          </p>
          <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
            Zásady používania <span className="text-brand">cookies</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-600 md:text-base">
            Aké cookies na našom e-shope používame, na čo slúžia a ako si môžete
            voľbu kedykoľvek zmeniť.
          </p>
        </div>
      </header>

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
