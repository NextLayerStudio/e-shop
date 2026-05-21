import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "./Logo";
import { CartIcon } from "./CartIcon";
import { SearchBar } from "./SearchBar";
import { NavbarNavLinks } from "./NavbarNavLinks";

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200/60 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:px-6">
        <Logo size="nav" />

        <nav className="hidden items-center gap-2 md:flex">
          <NavbarNavLinks />
        </nav>

        <div className="ml-auto flex flex-1 items-center justify-end gap-3 md:flex-none md:ml-0 md:flex-1 md:justify-end">
          <Suspense fallback={<div className="hidden md:block md:w-64 lg:w-80" />}>
            <SearchBar className="hidden md:flex md:w-64 lg:w-80" />
          </Suspense>
          <Link
            href="/admin"
            aria-label="Účet"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-700 shadow-sm hover:bg-neutral-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M20 21a8 8 0 1 0-16 0" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>
          <CartIcon />
        </div>
      </div>

      {/* mobile nav */}
      <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 md:hidden">
        <NavbarNavLinks className="whitespace-nowrap" />
      </nav>
    </header>
  );
}
