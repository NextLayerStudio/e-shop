"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function PromoDeleteButton({
  promoId,
  code,
}: {
  promoId: string;
  code: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onClick() {
    if (
      !window.confirm(
        `Naozaj chceš zmazať kupón "${code}"? Objednávky zostanú uložené, väzba na kupón sa odstráni.`
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/admin/promo/${promoId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        window.alert(data.error ?? "Nepodarilo sa zmazať kupón.");
        return;
      }
      router.push("/admin/promo");
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
      {isPending ? "Mažem…" : "Zmazať"}
    </button>
  );
}
