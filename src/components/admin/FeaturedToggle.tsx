"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Field = "isActive" | "isFeaturedHome" | "isHitOfWeek";

export function FeaturedToggle({
  productId,
  field,
  value,
}: {
  productId: string;
  field: Field;
  value: boolean;
}) {
  const router = useRouter();
  const [optimistic, setOptimistic] = useState(value);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !optimistic;
    setOptimistic(next);
    startTransition(async () => {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: next }),
      });
      if (!res.ok) {
        setOptimistic(!next);
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-pressed={optimistic}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
        optimistic ? "bg-brand" : "bg-neutral-300"
      } ${isPending ? "opacity-60" : ""}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
          optimistic ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
