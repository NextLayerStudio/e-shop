const labels: Record<string, { label: string; className: string }> = {
  NEW: { label: "Nová", className: "bg-blue-100 text-blue-700" },
  CONFIRMED: { label: "Potvrdená", className: "bg-indigo-100 text-indigo-700" },
  PAID: { label: "Zaplatená", className: "bg-emerald-100 text-emerald-700" },
  SHIPPED: { label: "Odoslaná", className: "bg-cyan-100 text-cyan-700" },
  COMPLETED: { label: "Dokončená", className: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Zrušená", className: "bg-red-100 text-red-700" },
};

export function OrderStatusBadge({ status }: { status: string }) {
  const meta = labels[status] ?? { label: status, className: "bg-neutral-100 text-neutral-700" };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.className}`}>
      {meta.label}
    </span>
  );
}

export const ORDER_STATUS_OPTIONS = Object.entries(labels).map(([value, meta]) => ({
  value,
  label: meta.label,
}));
