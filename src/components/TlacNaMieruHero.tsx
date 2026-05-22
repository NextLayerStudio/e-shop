import Image from "next/image";
import Link from "next/link";

/**
 * Promo hero aligned with „Tlač na mieru“ mockup: dark banner, spotlight copy, image.
 */
export function TlacNaMieruHero() {
  return (
    <section className="overflow-hidden rounded-[2rem] bg-neutral-800 px-6 py-10 shadow-lg ring-1 ring-black/10 md:px-10 md:py-12 lg:rounded-[2.25rem]">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="text-center lg:text-left">
          <p className="text-sm font-medium tracking-wide text-white/75">
            Hit týždňa
          </p>
          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-accent md:text-4xl lg:text-[2.65rem] lg:leading-tight">
            najpopulárnejší výtlačok od zákazníka
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-pretty leading-relaxed text-white/85 lg:mx-0">
            Táto nádherná a osobitá malá figúrka slona je plne pohyblivá. Od nôh,
            cez telo až po samotný chobot sa vie tento slon hýbať a otáčať. Hlava
            sa otáča dokonca o celých 360° takže na vás môže dohliadať zo všetkých
            strán, nech už je kdekoľvek.
          </p>
          <Link
            href="#tlac-form"
            className="mt-8 inline-flex rounded-full bg-brand px-7 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-dark"
          >
            Pozrieť viac
          </Link>
        </div>

        <div className="relative mx-auto aspect-[5/4] w-full max-w-xl overflow-hidden rounded-3xl bg-neutral-900 ring-2 ring-white/10 lg:aspect-[16/13] lg:max-w-none">
          <Image
            src="/customer_print.jpg"
            alt="3D tlačený slon od zákazníka"
            fill
            className="object-cover object-center"
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority
          />
        </div>
      </div>
    </section>
  );
}
