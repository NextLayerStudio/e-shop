"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Image from "next/image";

type ImgInfo = {
  id: string;
  isPrimary: boolean;
  sortOrder: number;
  alt: string | null;
};

export function ProductImagesManager({
  productId,
  images,
}: {
  productId: string;
  images: ImgInfo[];
}) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function uploadFiles() {
    if (files.length === 0) return;
    setUploading(true);
    setError(null);

    const fd = new FormData();
    for (const f of files) fd.append("images", f);

    const res = await fetch(`/api/admin/products/${productId}/images`, {
      method: "POST",
      body: fd,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Nahrávanie zlyhalo.");
      setUploading(false);
      return;
    }
    setFiles([]);
    setUploading(false);
    router.refresh();
  }

  function deleteImage(imageId: string) {
    if (!window.confirm("Odstrániť obrázok?")) return;
    startTransition(async () => {
      await fetch(`/api/admin/products/${productId}/images/${imageId}`, {
        method: "DELETE",
      });
      router.refresh();
    });
  }

  function setPrimary(imageId: string) {
    startTransition(async () => {
      await fetch(`/api/admin/products/${productId}/images/${imageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrimary: true }),
      });
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200">
      <h2 className="mb-3 text-base font-semibold text-neutral-900">Obrázky</h2>

      {images.length === 0 ? (
        <p className="text-sm text-neutral-500">Zatiaľ žiadne obrázky.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {images.map((img) => (
            <li
              key={img.id}
              className="group relative overflow-hidden rounded-lg ring-1 ring-neutral-200"
            >
              <div className="relative aspect-square bg-neutral-100">
                <Image
                  src={`/api/images/${img.id}`}
                  alt={img.alt ?? ""}
                  fill
                  sizes="160px"
                  className="object-cover"
                  unoptimized
                />
              </div>
              {img.isPrimary && (
                <span className="absolute left-1 top-1 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-white">
                  Hlavný
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-black/60 p-1 opacity-0 transition group-hover:opacity-100">
                {!img.isPrimary && (
                  <button
                    type="button"
                    onClick={() => setPrimary(img.id)}
                    disabled={isPending}
                    className="rounded bg-white/90 px-2 py-1 text-[10px] font-medium text-neutral-800"
                  >
                    Nastaviť hlavný
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => deleteImage(img.id)}
                  disabled={isPending}
                  className="ml-auto rounded bg-red-500 px-2 py-1 text-[10px] font-medium text-white"
                >
                  Zmazať
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="block text-sm text-neutral-700 file:mr-3 file:rounded-full file:border-0 file:bg-neutral-200 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-neutral-700 hover:file:bg-neutral-300"
        />
        <button
          type="button"
          onClick={uploadFiles}
          disabled={uploading || files.length === 0}
          className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {uploading ? "Nahrávam…" : `Nahrať ${files.length || ""}`}
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}
    </div>
  );
}
