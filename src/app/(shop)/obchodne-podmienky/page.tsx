import Link from "next/link";
import { BRAND_NAME } from "@/lib/brand";
import { COMPANY_CONTACT } from "@/lib/companyContact";

export const metadata = {
  title: "Obchodné podmienky",
  description: `Obchodné podmienky internetového obchodu ${BRAND_NAME} – objednávka, platba, doručenie, reklamácie.`,
};

function ListItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="text-neutral-700 leading-relaxed">{children}</li>
  );
}

function BulletList({ children }: { children: React.ReactNode }) {
  return (
    <ul className="list-inside list-disc space-y-1.5 marker:text-brand">
      {children}
    </ul>
  );
}

const sections = [
  {
    n: 1,
    title: "Predmet zmluvy",
    content: (
      <p className="text-neutral-700 leading-relaxed">
        Predmetom predaja sú 3D výtlačené produkty a doplnky ponúkané v e-shope{" "}
        {BRAND_NAME} — napríklad figúrky, prívesky, magnetky, hračky, produkty na
        organizovanie a ďalší sortiment uvedený v katalógu. Na vyžiadanie je možné
        objednať aj{" "}
        <Link href="/tlac-na-mieru" className="font-medium text-brand hover:text-brand-dark">
          tlač na mieru
        </Link>{" "}
        podľa individuálnej dohody.
      </p>
    ),
  },
  {
    n: 2,
    title: "Objednávka a uzatvorenie zmluvy",
    content: (
      <BulletList>
        <ListItem>
          Kupujúci si objednáva tovar prostredníctvom objednávkového formulára na
          webovej stránke a dokončením procesu v pokladni.
        </ListItem>
        <ListItem>
          Odoslaním objednávky kupujúci potvrdzuje, že sa oboznámil s týmito
          obchodnými podmienkami.
        </ListItem>
        <ListItem>
          Kúpna zmluva je uzatvorená odoslaním potvrdenia objednávky Predávajúcim
          na e-mail kupujúceho.
        </ListItem>
      </BulletList>
    ),
  },
  {
    n: 3,
    title: "Cena a platobné podmienky",
    content: (
      <div className="space-y-3">
        <p className="text-neutral-700 leading-relaxed">
          Ceny produktov sú uvedené v eurách vrátane DPH, pokiaľ nie je pri
          konkrétnom produkte uvedené inak.
        </p>
        <p className="text-neutral-700 leading-relaxed">Kupujúci môže platiť:</p>
        <BulletList>
          <ListItem>
            bankovým prevodom na účet Predávajúceho (platba cez QR kód Pay by Square
            po vytvorení objednávky),
          </ListItem>
        </BulletList>
        <p className="text-neutral-700 leading-relaxed">
          Tovar bude expedovaný po pripísaní platby na účet Predávajúceho a
          potvrdení objednávky.
        </p>
      </div>
    ),
  },
  {
    n: 4,
    title: "Dodanie tovaru",
    content: (
      <BulletList>
        <ListItem>
          Tovar je doručovaný prostredníctvom zvolenej prepravnej služby (Packeta –
          výdajné miesto alebo doručenie na adresu).
        </ListItem>
        <ListItem>
          Štandardná dodacia lehota je 2–7 pracovných dní od potvrdenia objednávky a
          prijatia platby, ak nie je dohodnuté inak (napr. pri tlači na mieru).
        </ListItem>
        <ListItem>
          Náklady na doručenie sú uvedené pri objednávke podľa zvoleného spôsobu
          dopravy.
        </ListItem>
      </BulletList>
    ),
  },
  {
    n: 5,
    title: "Právo na odstúpenie od zmluvy",
    content: (
      <div className="space-y-3 text-neutral-700 leading-relaxed">
        <p>
          Kupujúci – spotrebiteľ má právo odstúpiť od kúpnej zmluvy do{" "}
          <strong className="text-neutral-900">14 dní</strong> od prevzatia tovaru
          bez udania dôvodu.
        </p>
        <p>Tovar musí byť:</p>
        <BulletList>
          <ListItem>nepoužitý a nepoškodený,</ListItem>
          <ListItem>v pôvodnom obale, ak je možné ho vrátiť.</ListItem>
        </BulletList>
        <p>
          Odstúpenie od zmluvy je možné doručiť písomne alebo e-mailom na kontakty
          Predávajúceho uvedené vyššie.
        </p>
        <p>
          Predávajúci vráti kúpnu cenu do 14 dní od doručenia vráteného tovaru
          alebo preukázania jeho odoslania.
        </p>
      </div>
    ),
  },
  {
    n: 6,
    title: "Reklamácie a zodpovednosť za vady",
    content: (
      <div className="space-y-3 text-neutral-700 leading-relaxed">
        <p>
          Predávajúci zodpovedá za vady tovaru podľa zákona č. 250/2007 Z. z. o
          ochrane spotrebiteľa a Občianskeho zákonníka.
        </p>
        <p>Záručná doba je 24 mesiacov, pokiaľ nie je uvedené inak.</p>
        <p>Kupujúci má právo na:</p>
        <BulletList>
          <ListItem>opravu,</ListItem>
          <ListItem>výmenu tovaru,</ListItem>
          <ListItem>odstúpenie od zmluvy pri podstatnej vade.</ListItem>
        </BulletList>
      </div>
    ),
  },
] as const;

const complaintSections = [
  {
    n: 1,
    title: "Uplatnenie reklamácie",
    content: (
      <div className="space-y-3">
        <p className="text-neutral-700 leading-relaxed">
          Reklamáciu je možné uplatniť e-mailom na{" "}
          <Link
            href={`mailto:${COMPANY_CONTACT.email}`}
            className="font-medium text-brand hover:text-brand-dark"
          >
            {COMPANY_CONTACT.email}
          </Link>{" "}
          alebo poštou na sídlo Predávajúceho.
        </p>
        <p className="text-neutral-700">K reklamácii je potrebné priložiť:</p>
        <BulletList>
          <ListItem>doklad o kúpe,</ListItem>
          <ListItem>popis vady,</ListItem>
          <ListItem>fotografie vady.</ListItem>
        </BulletList>
      </div>
    ),
  },
  {
    n: 2,
    title: "Riešenie reklamácie",
    content: (
      <BulletList>
        <ListItem>Predávajúci vybaví reklamáciu do 30 dní od jej doručenia.</ListItem>
        <ListItem>
          Reklamácia môže byť vybavená opravou, výmenou tovaru, zľavou alebo
          odstúpením od zmluvy.
        </ListItem>
      </BulletList>
    ),
  },
  {
    n: 3,
    title: "Výnimky z reklamácie",
    content: (
      <>
        <p className="mb-2 text-neutral-700">Reklamácia sa nevzťahuje na:</p>
        <BulletList>
          <ListItem>mechanické poškodenie spôsobené kupujúcim,</ListItem>
          <ListItem>bežné opotrebenie a drobné odchýlky typické pre 3D tlač,</ListItem>
          <ListItem>nesprávne používanie alebo skladovanie tovaru,</ListItem>
          <ListItem>
            poškodenie vzniknuté neodbornou montážou alebo úpravou produktu
            kupujúcim.
          </ListItem>
        </BulletList>
      </>
    ),
  },
] as const;

export default function ObchodnePodmienkyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
      <header className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200">
        <div className="h-1.5 bg-gradient-to-r from-brand via-brand to-accent" />
        <div className="px-6 py-8 md:px-8 md:py-10">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">
            Právne informácie
          </p>
          <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
            Obchodné podmienky
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-600 md:text-base">
            Práva a povinnosti pri nákupe v internetovom obchode {BRAND_NAME}.
          </p>
        </div>
      </header>

      <section className="mt-8 rounded-2xl bg-white p-6 ring-1 ring-neutral-200 md:p-7">
        <h2 className="text-lg font-semibold text-neutral-900 md:text-xl">
          Prevádzkovateľ e-shopu
        </h2>
        <div className="mt-4 space-y-2 text-sm leading-relaxed text-neutral-700 md:text-base">
          <p>
            <strong className="text-neutral-900">{COMPANY_CONTACT.legalName}</strong>
            <br />
            {COMPANY_CONTACT.responsiblePerson}
          </p>
          <p>
            <span className="text-neutral-500">Sídlo: </span>
            {COMPANY_CONTACT.address}, Slovensko
          </p>
          <p>
            <span className="text-neutral-500">IČO: </span>
            {COMPANY_CONTACT.ico}
            <span className="text-neutral-500"> · DIČ: </span>
            {COMPANY_CONTACT.dic}
          </p>
          <p>
            <span className="text-neutral-500">E-mail: </span>
            <Link
              href={`mailto:${COMPANY_CONTACT.email}`}
              className="font-medium text-brand hover:text-brand-dark"
            >
              {COMPANY_CONTACT.email}
            </Link>
          </p>
          <div className="space-y-1 pt-1 text-sm text-neutral-600">
            {COMPANY_CONTACT.registryLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
        <p className="mt-5 text-sm leading-relaxed text-neutral-600 md:text-base">
          Tieto obchodné podmienky upravujú práva a povinnosti medzi prevádzkovateľom
          e-shopu (ďalej len „Predávajúci“) a jeho zákazníkmi (ďalej len „Kupujúci“)
          pri predaji tovaru prostredníctvom internetového obchodu {BRAND_NAME}.
        </p>
      </section>

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
            <div className="pl-0 text-sm md:pl-[52px] md:text-base">{content}</div>
          </section>
        ))}
      </div>

      <section className="mt-8 rounded-2xl bg-white p-6 ring-1 ring-neutral-200 md:p-7">
        <h2 className="text-lg font-semibold text-neutral-900 md:text-xl">
          Reklamačný poriadok
        </h2>
        <div className="mt-6 space-y-6">
          {complaintSections.map(({ n, title, content }) => (
            <div key={n}>
              <h3 className="flex items-center gap-3 font-semibold text-neutral-900">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-600">
                  {n}
                </span>
                {title}
              </h3>
              <div className="mt-3 pl-0 text-sm md:pl-10 md:text-base">{content}</div>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-8 text-center text-xs text-neutral-400">
        Posledná aktualizácia: jún 2026
      </p>
    </div>
  );
}
