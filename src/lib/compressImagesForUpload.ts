import imageCompression from "browser-image-compression";

/** Max. dlhá strana pre e-commerce (postačí na retina grid + zoom). */
export const UPLOAD_MAX_EDGE_PX = 1600;

/** Cieľ pod limitom ~4,5 MB / request na Verceli (s multipart hlavičkami). */
const TARGET_MAX_SIZE_MB = 3.4;

const WEBP_QUALITY = 0.82;
const JPEG_QUALITY = 0.84;

function stripExtension(name: string): string {
  const i = name.lastIndexOf(".");
  return i === -1 ? name : name.slice(0, i);
}

function canEncodeWebp(): boolean {
  if (typeof document === "undefined") return false;
  const c = document.createElement("canvas");
  c.width = 1;
  c.height = 1;
  return c.toDataURL("image/webp").startsWith("data:image/webp");
}

function shouldCompressRaster(file: File): boolean {
  const t = file.type.toLowerCase();
  if (t === "image/svg+xml") return false;
  return t.startsWith("image/");
}

const baseOptions = {
  maxSizeMB: TARGET_MAX_SIZE_MB,
  maxWidthOrHeight: UPLOAD_MAX_EDGE_PX,
  useWebWorker: true,
  maxIteration: 15,
} as const;

/**
 * Zmenší rozmer a prekóduje na WebP (alebo JPEG) pred odoslaním na API.
 * SVG sa necháva ako je (vektor); ostatné rastrové typy sa komprimujú.
 */
export async function compressImageForUpload(file: File): Promise<File> {
  if (!shouldCompressRaster(file)) {
    return file;
  }

  // Už malé súbory netreba znova kódovať (rýchlejší submit).
  if (file.size < 120_000) {
    return file;
  }

  try {
    if (canEncodeWebp()) {
      const out = await imageCompression(file, {
        ...baseOptions,
        fileType: "image/webp",
        initialQuality: WEBP_QUALITY,
      });
      return new File([out], `${stripExtension(file.name)}.webp`, {
        type: "image/webp",
        lastModified: Date.now(),
      });
    }
  } catch {
    // WebP zlyhal (napr. exotický formát) — skús JPEG.
  }

  const out = await imageCompression(file, {
    ...baseOptions,
    fileType: "image/jpeg",
    initialQuality: JPEG_QUALITY,
  });
  return new File([out], `${stripExtension(file.name)}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

/**
 * Postupne (šetrí pamäť pri 8× veľkých fotkách z mobilu).
 */
export async function compressImagesForUpload(files: File[]): Promise<File[]> {
  const result: File[] = [];
  for (const f of files) {
    try {
      result.push(await compressImageForUpload(f));
    } catch (e) {
      const hint =
        f.name.toLowerCase().endsWith(".heic") ||
        f.name.toLowerCase().endsWith(".heif") ||
        f.type.includes("heic")
          ? " Tip: HEIC exportuj v Fotkách ako JPG, alebo skús Safari."
          : "";
      throw new Error(
        `Nepodarilo sa optimalizovať „${f.name}“. ${e instanceof Error ? e.message : String(e)}${hint}`
      );
    }
  }
  return result;
}
