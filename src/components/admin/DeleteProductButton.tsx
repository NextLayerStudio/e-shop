"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function DeleteProductButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onClick() {
    if (
      !window.confirm(
        `Naozaj chceš odstrániť produkt "${productName}"? Túto akciu nie je možné vrátiť.`
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        window.alert(data.error ?? "Nepodarilo sa odstrániť produkt.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
    >
      {isPending ? "Mažem…" : "Odstrániť"}
    </button>
  );
}
