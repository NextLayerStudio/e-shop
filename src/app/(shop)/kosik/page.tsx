import { CartView } from "@/components/CartView";

export const metadata = { title: "Košík" };

export default function KosikPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <h1 className="text-2xl font-bold text-neutral-900">Košík</h1>
      <CartView />
    </div>
  );
}
