"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { id: string; isActive: boolean };

export function PromoActiveToggle({ id, isActive }: Props) {
  const router = useRouter();
  const [active, setActive] = useState(isActive);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/promo/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !active }),
      });
      if (res.ok) {
        setActive((a) => !a);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        active
          ? "bg-green-100 text-green-800"
          : "bg-neutral-200 text-neutral-600"
      } disabled:opacity-50`}
    >
      {active ? "Aktívny" : "Neaktívny"}
    </button>
  );
}
