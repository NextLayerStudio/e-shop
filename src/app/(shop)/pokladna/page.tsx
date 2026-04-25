import { CheckoutForm } from "@/components/CheckoutForm";

export const metadata = { title: "Pokladňa" };

export default function PokladnaPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <h1 className="text-2xl font-bold text-neutral-900">Pokladňa</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Vyplň údaje pre doručenie. Po odoslaní objednávky ťa budeme kontaktovať.
      </p>
      <CheckoutForm />
    </div>
  );
}
