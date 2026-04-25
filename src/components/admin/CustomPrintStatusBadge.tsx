const labels: Record<string, { label: string; className: string }> = {
  NEW: { label: "Nová", className: "bg-blue-100 text-blue-700" },
  IN_REVIEW: { label: "V posúdení", className: "bg-indigo-100 text-indigo-700" },
  QUOTED: { label: "Cenová ponuka", className: "bg-amber-100 text-amber-700" },
  ACCEPTED: { label: "Prijaté", className: "bg-emerald-100 text-emerald-700" },
  REJECTED: { label: "Zamietnuté", className: "bg-red-100 text-red-700" },
  COMPLETED: { label: "Dokončené", className: "bg-green-100 text-green-700" },
};

export function CustomPrintStatusBadge({ status }: { status: string }) {
  const meta =
    labels[status] ?? { label: status, className: "bg-neutral-100 text-neutral-700" };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.className}`}>
      {meta.label}
    </span>
  );
}

export const CUSTOM_PRINT_STATUS_OPTIONS = Object.entries(labels).map(
  ([value, meta]) => ({ value, label: meta.label })
);
