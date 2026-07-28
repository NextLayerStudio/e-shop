/**
 * Favicon z public/LOGO.webp
 * - Prehliadač (tab): čierne pozadie ako logo — vyzeralo dobre
 * - Google (kruh): logo zväčšené na maximum, min. okraj kvôli orezu
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

/** Čierne pozadie loga — dobré v Safari / Chrome tabe. */
const ICON_BG = { r: 0, g: 0, b: 0, alpha: 1 };
/** Malý okraj — Google orezá rohy do kruhu, logo musí byť veľké. */
const PAD_RATIO = 0.035;

if (!fs.existsSync(input)) {
  console.error("Chýba public/LOGO.webp");
  process.exit(1);
}

async function buildMasterSquare(size) {
  const trimmed = await sharp(input).trim({ threshold: 12 }).png().toBuffer();
  const pad = Math.round(size * PAD_RATIO);
  const inner = size - pad * 2;

  return sharp(trimmed)
    .resize(inner, inner, {
      fit: "contain",
      background: ICON_BG,
    })
    .extend({
      top: pad,
      bottom: pad,
      left: pad,
      right: pad,
      background: ICON_BG,
    })
    .png()
    .toBuffer();
}

async function render(size, sharpen = false) {
  let img = sharp(await buildMasterSquare(Math.max(size, 512))).resize(size, size);
  if (sharpen) img = img.sharpen({ sigma: 0.5, m1: 0.5, m2: 0.25 });
  return img.png().toBuffer();
}

const png192 = await render(192);
const png180 = await render(180);
const png48 = await render(48);
const png32 = await render(32, true);
const png16 = await render(16, true);

const ico = await toIco([png16, png32, png48]);

fs.writeFileSync(path.join(appDir, "favicon.ico"), ico);
fs.writeFileSync(path.join(publicDir, "favicon.ico"), ico);
fs.writeFileSync(path.join(appDir, "icon.png"), png192);
fs.writeFileSync(path.join(publicDir, "icon.png"), png192);
fs.writeFileSync(path.join(appDir, "apple-icon.png"), png180);
fs.writeFileSync(path.join(publicDir, "apple-touch-icon.png"), png180);

console.log("Favicon OK (čierne pozadie, logo zväčšené pre Google kruh).");
