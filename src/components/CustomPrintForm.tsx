"use client";

import Image from "next/image";
import { useRef, useState } from "react";

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

const inputClass =
  "w-full rounded-2xl border-0 bg-white px-4 py-3.5 text-sm text-neutral-900 shadow-sm placeholder:text-accent/90 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/40 md:text-[15px]";

const textareaClass =
  `${inputClass} min-h-[180px] resize-y`;

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-7-9l4 4m0 0l4-4m-4 4V4"
      />
    </svg>
  );
}

export function CustomPrintForm() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const file = formData.get("file");
    if (file instanceof File && file.size > MAX_FILE_BYTES) {
      setError("Súbor je príliš veľký (max. 25 MB).");
      setSubmitting(false);
      return;
    }
    if (file instanceof File && file.size === 0) {
      formData.delete("file");
    }

    try {
      const res = await fetch("/api/custom-print", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Nepodarilo sa odoslať požiadavku.");
        setSubmitting(false);
        return;
      }
      setSuccess(
        `Ďakujeme! Tvoja požiadavka bola prijatá pod číslom ${data.requestNumber}. Odpovieme do 48 hodín.`
      );
      form.reset();
      setFileName(null);
      setSubmitting(false);
    } catch {
      setError("Pri odosielaní nastala chyba.");
      setSubmitting(false);
    }
  }

  return (
    <form
      id="tlac-form"
      onSubmit={onSubmit}
      encType="multipart/form-data"
      className="mt-8 rounded-[2rem] bg-[#cceaf8]/90 p-6 shadow-inner ring-1 ring-sky-200/80 md:p-10 lg:p-12"
    >
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-10 xl:gap-14">
        <div className="space-y-4">
          <input
            name="customerName"
            type="text"
            required
            autoComplete="name"
            placeholder="meno a priezvisko"
            aria-label="Meno a priezvisko"
            className={inputClass}
          />
          <input
            name="customerEmail"
            type="email"
            required
            autoComplete="email"
            placeholder="email"
            aria-label="Email"
            className={inputClass}
          />
          <input
            name="customerPhone"
            type="tel"
            autoComplete="tel"
            placeholder="tel."
            aria-label="Telefón"
            className={inputClass}
          />
          <textarea
            name="description"
            required
            minLength={5}
            placeholder="Opis nápadu alebo dizajnu…"
            aria-label="Popis nápadu alebo dizajnu"
            rows={8}
            className={textareaClass}
          />
        </div>

        <div className="flex flex-col">
          <div className="relative min-h-[280px] flex-1 overflow-hidden rounded-[1.75rem] bg-neutral-200 shadow-md ring-1 ring-neutral-300/60 lg:min-h-[360px]">
            <Image
              src="/images/tlac-na-mieru-mockup.png"
              alt=""
              fill
              className="object-cover object-center"
              sizes="(min-width: 1024px) 40vw, 100vw"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent pb-16 pt-20" />

            <input
              ref={fileRef}
              name="file"
              type="file"
              accept=".stl,.obj,.3mf,.step,.stp,.zip,image/*,application/pdf"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setFileName(f ? f.name : null);
              }}
            />

            <div className="absolute inset-x-4 bottom-4 flex flex-col gap-3 sm:inset-x-6">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3.5 text-sm font-bold text-neutral-900 shadow-md ring-2 ring-accent/70 transition hover:brightness-95 disabled:opacity-50"
              >
                <UploadIcon className="h-5 w-5 shrink-0" />
                Priložiť súbor
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-brand px-5 py-3.5 text-sm font-bold text-neutral-950 shadow-md ring-2 ring-brand/35 transition hover:brightness-[0.92] disabled:opacity-50"
              >
                {submitting ? "Odosielam…" : "Odoslať"}
              </button>
              <p className="truncate text-center text-xs font-medium text-white drop-shadow-md">
                {fileName ? (
                  <span title={fileName}>Vybraný súbor: {fileName}</span>
                ) : (
                  <span className="text-white/90">
                    Voliteľne: STL, OBJ, 3MF, STEP, PDF, obrázok — max. 25 MB.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {(error ?? success) && (
        <div className="mt-8 space-y-3 lg:mt-10">
          {error && (
            <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-2xl bg-green-50 p-4 text-sm text-green-700 ring-1 ring-green-200">
              {success}
            </div>
          )}
        </div>
      )}
    </form>
  );
}
