// Prepares photos for the homepage banner.
//
//   1. Put your photos in the folder  hero-source/   (JPEG, PNG, WebP or AVIF, any size)
//   2. Run:  npm run hero-images
//   3. Run:  npm run dev   (or push to GitHub)
//
// Each photo becomes two small, fast web versions in src/assets/hero/.
// The homepage finds them automatically. No code editing needed.

import { mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SOURCE = "hero-source";
const OUTPUT = "src/assets/hero";
const WIDTHS = [800, 1600];
const MAX_PHOTOS = 6;
const ALLOWED = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

function slugify(name) {
  const base = name.replace(/\.[^.]+$/, "").toLowerCase();
  return base.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "photo";
}

function kb(bytes) {
  return `${Math.round(bytes / 1024)} KB`;
}

await mkdir(SOURCE, { recursive: true });
await mkdir(OUTPUT, { recursive: true });

const entries = (await readdir(SOURCE)).sort();
const photos = entries.filter((file) => ALLOWED.has(path.extname(file).toLowerCase()));
const skipped = entries.filter(
  (file) =>
    !ALLOWED.has(path.extname(file).toLowerCase()) &&
    !file.startsWith(".") &&
    file !== "README.txt",
);

if (photos.length === 0) {
  console.log(`\nNo photos found in ${SOURCE}/ yet.`);
  console.log("Copy some JPEG or PNG photos in there, then run this command again.\n");
  process.exit(0);
}

// Start fresh so photos you removed from hero-source/ disappear from the site too.
for (const old of await readdir(OUTPUT)) {
  if (old.endsWith(".webp")) await rm(path.join(OUTPUT, old));
}

const used = new Set();
let made = 0;
for (const file of photos.slice(0, MAX_PHOTOS)) {
  let slug = slugify(file);
  while (used.has(slug)) slug += "-2";
  used.add(slug);

  try {
    const input = path.join(SOURCE, file);
    // .rotate() follows the phone's orientation so portrait photos are not sideways.
    const upright = await sharp(input).rotate().toBuffer();
    const meta = await sharp(upright).metadata();
    const srcWidth = meta.width ?? 0;
    const srcHeight = meta.height ?? 0;
    const note = srcWidth < 1200 ? "  (small photo: may look soft on big screens)" : "";
    const lines = [];
    for (const width of WIDTHS) {
      // Banner photos are cropped to a 3:2 landscape shape, keeping the most
      // interesting part (faces, people). Photos are never enlarged.
      const outWidth = Math.min(width, srcWidth, Math.round(srcHeight * 1.5));
      const outHeight = Math.round(outWidth / 1.5);
      const target = path.join(OUTPUT, `${slug}-${width}.webp`);
      await sharp(upright)
        .resize({
          width: outWidth,
          height: outHeight,
          fit: "cover",
          position: sharp.strategy.attention,
        })
        .webp({ quality: 72 })
        .toFile(target);
      lines.push(`${width}px: ${kb((await stat(target)).size)}`);
    }
    console.log(`✓ ${file} -> ${slug}  [${lines.join(", ")}]${note}`);
    made += 1;
  } catch {
    console.log(`✗ ${file}: could not be read. Try saving it again as a normal JPEG or PNG.`);
  }
}

if (photos.length > MAX_PHOTOS) {
  console.log(
    `\nOnly the first ${MAX_PHOTOS} photos are used (the banner stays fast). ${photos.length - MAX_PHOTOS} skipped.`,
  );
}
for (const file of skipped) console.log(`- Skipped ${file}: use JPEG, PNG, WebP or AVIF.`);
console.log(`\nDone. ${made} photo(s) ready. Restart npm run dev to see them.\n`);
