import { PromoForm } from "@/components/admin/PromoForm";

export const metadata = { title: "Admin – Nový promo kód" };

export default function AdminNewPromoPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">Nový promo kód</h1>
      <PromoForm mode="create" />
    </div>
  );
}
