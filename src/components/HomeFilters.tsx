import Link from "next/link";

const filters = [
  { key: "popular", label: "Najpopulárnejšie" },
  { key: "practical", label: "Praktické" },
  { key: "price", label: "Podľa ceny" },
] as const;

export function HomeFilters({ sort }: { sort: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((f) => {
        const active = sort === f.key;
        return (
          <Link
            key={f.key}
            href={`/?sort=${f.key}`}
            scroll={false}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium ring-1 transition ${
              active
                ? "bg-brand text-white ring-brand"
                : "bg-white text-neutral-700 ring-neutral-200 hover:ring-brand/40"
            }`}
          >
            {f.label}
          </Link>
        );
      })}
    </div>
  );
}
