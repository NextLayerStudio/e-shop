"use client";

import { useId, useState } from "react";

type ProductDescriptionExpandProps = {
  shortDescription: string | null;
  description: string;
};

export function ProductDescriptionExpand({
  shortDescription,
  description,
}: ProductDescriptionExpandProps) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

  const shortText = shortDescription?.trim() ?? "";
  const fullText = description.trim();
  const hasMore =
    fullText.length > 0 &&
    fullText !== shortText &&
    (shortText.length === 0 || fullText.length > shortText.length);

  if (!shortText && !fullText) return null;

  if (!shortText) {
    return (
      <div className="prose prose-sm max-w-none whitespace-pre-line text-neutral-700">
        {fullText}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-base leading-relaxed text-neutral-700">{shortText}</p>

      {hasMore && (
        <>
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            aria-expanded={expanded}
            aria-controls={panelId}
            className="text-sm font-semibold text-brand hover:text-brand-dark"
          >
            {expanded ? "Menej" : "Viac"}
          </button>

          <div
            id={panelId}
            className={`grid transition-[grid-template-rows] duration-300 ease-out ${
              expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden">
              <div className="prose prose-sm max-w-none whitespace-pre-line pt-1 text-neutral-700">
                {fullText}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
