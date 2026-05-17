type Props = {
  startsAt: Date;
  endsAt: Date | null;
  isActive: boolean;
};

/**
 * Human-readable lifecycle state for the promo list (independent of the manual on/off toggle after sync).
 */
export function PromoLifecycleBadge({ startsAt, endsAt, isActive }: Props) {
  const now = new Date();

  let label: string;
  let cls: string;

  if (!isActive) {
    label = "Vypnutý";
    cls = "bg-neutral-200 text-neutral-700";
  } else if (now < startsAt) {
    label = "Čaká na začiatok";
    cls = "bg-amber-100 text-amber-900";
  } else if (endsAt != null && now > endsAt) {
    label = "Expirovaný";
    cls = "bg-red-100 text-red-800";
  } else {
    label = "V platnosti";
    cls = "bg-green-100 text-green-800";
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}
