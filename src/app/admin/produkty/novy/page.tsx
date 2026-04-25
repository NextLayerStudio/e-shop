import { ProductForm } from "@/components/admin/ProductForm";

export const metadata = { title: "Admin – Nový produkt" };

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">Nový produkt</h1>
      <ProductForm mode="create" />
    </div>
  );
}
