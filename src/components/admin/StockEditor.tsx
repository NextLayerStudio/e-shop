"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function StockEditor({
  productId,
  stock,
}: {
  productId: string;
  stock: number;
}) {
  const router = useRouter();
  const [value, setValue] = useState(stock);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function save(next: number) {
    if (next < 0 || !Number.isFinite(next)) return;
    setValue(next);
    startTransition(async () => {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: next }),
      });
      if (res.ok) {
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1200);
        router.refresh();
      }
    });
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={() => save(value - 1)}
        disabled={isPending || value <= 0}
        className="h-8 w-8 rounded-md bg-neutral-100 text-neutral-700 hover:bg-neutral-200 disabled:opacity-40"
      >
        −
      </button>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        onBlur={(e) => save(Number(e.target.value))}
        className="h-8 w-16 rounded-md border border-neutral-200 px-2 text-center text-sm"
      />
      <button
        type="button"
        onClick={() => save(value + 1)}
        disabled={isPending}
        className="h-8 w-8 rounded-md bg-neutral-100 text-neutral-700 hover:bg-neutral-200 disabled:opacity-40"
      >
        +
      </button>
      {saved && <span className="text-xs text-green-600">Uložené</span>}
    </div>
  );
}
