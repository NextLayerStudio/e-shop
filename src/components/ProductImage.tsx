import Image from "next/image";

type Props = {
  imageId?: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fallbackClassName?: string;
};

/**
 * Renders a product image served from /api/images/[id].
 * If no imageId is provided, renders a neutral placeholder.
 */
export function ProductImage({
  imageId,
  alt,
  className = "",
  sizes = "(min-width: 768px) 33vw, 100vw",
  priority,
  fallbackClassName = "",
}: Props) {
  if (!imageId) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-300 ${fallbackClassName} ${className}`}
        aria-label={alt}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-10 w-10"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="9" cy="9" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      </div>
    );
  }

  return (
    <Image
      src={`/api/images/${imageId}`}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={`object-cover ${className}`}
      unoptimized
    />
  );
}
