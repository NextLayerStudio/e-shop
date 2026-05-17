"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Suggestion = { slug: string; name: string };

export function SearchBar({ className = "" }: { className?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const listId = "search-suggestions";
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setValue(params.get("q") ?? "");
  }, [params]);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 1) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const ac = new AbortController();
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(
            `/api/products/suggest?q=${encodeURIComponent(q)}`,
            { signal: ac.signal }
          );
          if (!res.ok) {
            setSuggestions([]);
            setOpen(false);
            return;
          }
          const data = (await res.json()) as { suggestions?: Suggestion[] };
          const next = data.suggestions ?? [];
          setSuggestions(next);
          setOpen(next.length > 0);
          setHighlight(-1);
        } catch (e) {
          if (e instanceof DOMException && e.name === "AbortError") return;
          if ((e as Error).name === "AbortError") return;
          setSuggestions([]);
          setOpen(false);
        }
      })();
    }, 220);

    return () => {
      window.clearTimeout(t);
      ac.abort();
    };
  }, [value]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!formRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const submitSearch = useCallback(() => {
    const q = value.trim();
    const target = q ? `/produkty?q=${encodeURIComponent(q)}` : "/produkty";
    router.push(target);
    setOpen(false);
  }, [router, value]);

  return (
    <form
      ref={formRef}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (highlight >= 0 && suggestions[highlight]) {
          router.push(`/produkty/${suggestions[highlight].slug}`);
          setOpen(false);
          return;
        }
        submitSearch();
      }}
      className={`relative z-50 flex items-center ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute left-3 h-4 w-4 text-neutral-400"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-3.5-3.5" />
      </svg>
      <input
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onKeyDown={(e) => {
          if (!open || suggestions.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) =>
              h < suggestions.length - 1 ? h + 1 : 0
            );
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) =>
              h <= 0 ? suggestions.length - 1 : h - 1
            );
          } else if (e.key === "Escape") {
            e.preventDefault();
            setOpen(false);
            setHighlight(-1);
          }
        }}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open && suggestions.length > 0}
        aria-controls={open && suggestions.length > 0 ? listId : undefined}
        placeholder="Hľadať"
        className="h-10 w-full rounded-full border border-neutral-200 bg-white py-2 pl-9 pr-4 text-sm text-neutral-700 placeholder:text-neutral-400 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
      />

      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-auto rounded-xl border border-neutral-200 bg-white py-1 shadow-lg"
        >
          {suggestions.map((s, i) => (
            <li key={s.slug} role="presentation">
              <Link
                href={`/produkty/${s.slug}`}
                role="option"
                aria-selected={i === highlight}
                className={`block truncate px-3 py-2 text-sm text-neutral-800 ${
                  i === highlight ? "bg-brand/10 text-brand-dark" : "hover:bg-neutral-50"
                }`}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => setOpen(false)}
              >
                {s.name}
              </Link>
            </li>
          ))}
          <li className="border-t border-neutral-100" role="presentation">
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-xs font-medium text-brand hover:bg-neutral-50"
              onClick={() => submitSearch()}
            >
              Zobraziť všetky výsledky pre &quot;{value.trim()}&quot;
            </button>
          </li>
        </ul>
      )}
    </form>
  );
}
