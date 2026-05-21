"use client";

import Image from "next/image";
import Link from "next/link";

const LOGO_SRC = "/LOGO.webp";
/** Rozmer súboru — pri výmene loga uprav podľa skutočného obrázka. */
const LOGO_DIMS = { width: 920, height: 1382 } as const;

type LogoProps = {
  className?: string;
  /** Predvolený odkaz v e-shope je domov; v admin paneli napr. `/admin`. */
  href?: string;
  /** `sm` — bočný panel; `md` — hlavička; `nav` — navbar; `lg` — pätička */
  size?: "sm" | "md" | "nav" | "lg";
};

const SIZE_CLASSES = {
  sm: "h-11",
  md: "h-12 md:h-14",
  nav: "h-14 md:h-16",
  lg: "h-20 md:h-28",
} as const;

const SIZE_WIDTHS = {
  sm: "88px",
  md: "140px",
  nav: "168px",
  lg: "280px",
} as const;

export function Logo({
  className = "",
  href = "/",
  size = "md",
}: LogoProps) {
  const heightClass = SIZE_CLASSES[size];

  return (
    <Link
      href={href}
      className={`inline-flex shrink-0 items-center transition-opacity hover:opacity-90 ${className}`}
      aria-label="know3D – domovská stránka"
    >
      <Image
        src={LOGO_SRC}
        alt="know3D"
        width={LOGO_DIMS.width}
        height={LOGO_DIMS.height}
        className={`${heightClass} w-auto object-contain`}
        priority={size === "md" || size === "nav"}
        sizes={SIZE_WIDTHS[size]}
      />
    </Link>
  );
}
