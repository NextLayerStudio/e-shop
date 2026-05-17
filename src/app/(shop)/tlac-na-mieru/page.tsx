import { CustomPrintForm } from "@/components/CustomPrintForm";
import { TlacNaMieruHero } from "@/components/TlacNaMieruHero";

export const metadata = { title: "Tlač na mieru" };

export default function TlacNaMieruPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <TlacNaMieruHero />

      <section className="mx-auto mt-14 max-w-6xl md:mt-20">
        <h1 className="text-balance text-center text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
          Chceš niečo vytlačiť na mieru?
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-center text-lg text-neutral-600 md:text-xl">
          Opíš mi čo máš na mysli a ja ti to nadizajnujem, alebo prilož súbor a ti
          to vytlačím.
        </p>
        <CustomPrintForm />
      </section>
    </div>
  );
}
