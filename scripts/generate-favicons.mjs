/**
 * Vygeneruje favicon súbory z public/LOGO.webp do src/app/.
 * Oreže prázdne okraje, logo vyplní štvorec (nie miniatúrka v strede).
 * Spustenie: npm run favicon:generate
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const input = path.join(root, "public", "LOGO.webp");
const appDir = path.join(root, "src", "app");

/** Pozadie loga — čierna z originálu, nie sivá stránka. */
const LOGO_BG = { r: 0, g: 0, b: 0, alpha: 1 };

if (!fs.existsSync(input)) {
  console.error("Chýba public/LOGO.webp");
  process.exit(1);
}

const trimmed = await sharp(input).trim({ threshold: 12 }).png().toBuffer();

/** Logo takmer štvorcové po orezaní — vyplní celú ikonu. */
async function writeSquare(size, dest, sharpen = false) {
  let img = sharp(trimmed).resize(size, size, {
    fit: "contain",
    background: LOGO_BG,
  });
  if (sharpen) img = img.sharpen({ sigma: 0.6, m1: 0.5, m2: 0.25 });
  await img.png().toFile(dest);
}

await writeSquare(512, path.join(appDir, "icon-512.png"));
await writeSquare(192, path.join(appDir, "icon.png"));
await writeSquare(180, path.join(appDir, "apple-icon.png"));
await writeSquare(32, path.join(appDir, "favicon.ico"), true);

console.log("Favicon súbory vygenerované (orezané logo, čierne pozadie).");
