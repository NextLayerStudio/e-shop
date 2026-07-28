/**
 * Vygeneruje favicon súbory z public/LOGO.webp.
 * Výstup: src/app/ (Next.js metadata) + public/ (Safari / Google priame URL).
 * Spustenie: npm run favicon:generate
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import toIco from "to-ico";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const input = path.join(root, "public", "LOGO.webp");
const appDir = path.join(root, "src", "app");
const publicDir = path.join(root, "public");

const LOGO_BG = { r: 0, g: 0, b: 0, alpha: 1 };

if (!fs.existsSync(input)) {
  console.error("Chýba public/LOGO.webp");
  process.exit(1);
}

const trimmed = await sharp(input).trim({ threshold: 12 }).png().toBuffer();

async function renderSquare(size, sharpen = false) {
  let img = sharp(trimmed).resize(size, size, {
    fit: "contain",
    background: LOGO_BG,
  });
  if (sharpen) img = img.sharpen({ sigma: 0.6, m1: 0.5, m2: 0.25 });
  return img.png().toBuffer();
}

const png192 = await renderSquare(192);
const png180 = await renderSquare(180);
const png48 = await renderSquare(48);
const png32 = await renderSquare(32, true);
const png16 = await renderSquare(16, true);

const ico = await toIco([png16, png32, png48]);

fs.writeFileSync(path.join(appDir, "favicon.ico"), ico);
fs.writeFileSync(path.join(publicDir, "favicon.ico"), ico);

fs.writeFileSync(path.join(appDir, "icon.png"), png192);
fs.writeFileSync(path.join(publicDir, "icon.png"), png192);

fs.writeFileSync(path.join(appDir, "apple-icon.png"), png180);
fs.writeFileSync(path.join(publicDir, "apple-touch-icon.png"), png180);

// Odstráň starý experimentálny súbor (Next ho neservuje, metadata naň 404)
const legacy512 = path.join(appDir, "icon-512.png");
if (fs.existsSync(legacy512)) fs.unlinkSync(legacy512);

console.log("Favicon OK → src/app/ + public/apple-touch-icon.png");
