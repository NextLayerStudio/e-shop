import { ShippingDopravaForm } from "@/components/ShippingDopravaForm";

export const metadata = { title: "Doprava" };

export default function PokladnaDopravaPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <h1 className="text-2xl font-bold text-neutral-900">Doprava</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Vyber spôsob doručenia. Cena dopravy sa pripočíta k objednávke na
        ďalšom kroku.
      </p>
      <ShippingDopravaForm />
    </div>
  );
}
