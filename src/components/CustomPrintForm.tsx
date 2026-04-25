"use client";

import { useState } from "react";

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

export function CustomPrintForm() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      setSubmitting(false);
    } catch {
      setError("Pri odosielaní nastala chyba.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      encType="multipart/form-data"
      className="mt-6 space-y-4 rounded-2xl bg-white p-6 ring-1 ring-neutral-200"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="customerName" label="Meno a priezvisko" required />
        <Field name="customerEmail" label="Email" type="email" required />
        <Field name="customerPhone" label="Telefón" type="tel" />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700">
          Popis projektu <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          required
          rows={6}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          placeholder="Popíš čo chceš vytlačiť: rozmery, materiál, farbu, množstvo, termín…"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700">
          Súbor (voliteľné)
        </label>
        <input
          name="file"
          type="file"
          accept=".stl,.obj,.3mf,.step,.stp,.zip,image/*,application/pdf"
          className="mt-1 block w-full text-sm text-neutral-700 file:mr-3 file:rounded-full file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-dark"
        />
        <p className="mt-1 text-xs text-neutral-400">Max. 25 MB. STL, OBJ, 3MF, STEP, ZIP, obrázok, PDF.</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700 ring-1 ring-green-200">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {submitting ? "Odosielam…" : "Odoslať požiadavku"}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-neutral-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
      />
    </label>
  );
}
