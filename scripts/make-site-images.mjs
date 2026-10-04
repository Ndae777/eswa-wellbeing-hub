// Prepares photos for cards and page headers across the website.
//
//   1. Put photos in the folder  site-images/  and NAME EACH FILE after the place it goes
//      (the full list of names is in site-images/README.txt)
//   2. Run:  npm run images
//   3. Restart:  npm run dev
//
// Example: a file called  card-workshops.jpg  appears on the Workshops card on the homepage.

import { mkdir, readFile, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SOURCE = "site-images";
const OUTPUT = "src/assets/site";
const ALLOWED = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

// Programme names come straight from the content file, so new programmes are picked up.
const content = await readFile("src/lib/eswa-content.ts", "utf8");
const programmeSlugs = [...content.matchAll(/slug:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]);

const pageSlots = [
  "page-workshops",
  "page-about",
  "page-resources",
  "page-feedback",
  "page-calendar",
];
const cardSlots = ["card-workshops", "card-chat", "card-support", "about-story"];
const programmeSlots = programmeSlugs.map((slug) => `programme-${slug}`);
const validSlots = [...pageSlots, ...cardSlots, ...programmeSlots];

function sizeFor(slot) {
  // Page headers are wide, so they get bigger files. Cards are small.
  if (slot.startsWith("page-") || slot === "about-story")
    return { widths: [800, 1600], ratio: 3 / 2 };
  return { widths: [480, 960], ratio: 3 / 2 };
}

function slugify(name) {
  return name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function closest(name) {
  const hit = validSlots.find((slot) => slot.includes(name) || name.includes(slot));
  return hit ? `  Did you mean "${hit}"?` : "";
}

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;

await mkdir(SOURCE, { recursive: true });
await mkdir(OUTPUT, { recursive: true });

const entries = (await readdir(SOURCE))
  .filter((f) => !f.startsWith(".") && f !== "README.txt")
  .sort();
if (entries.length === 0) {
  console.log(
    `\nNo photos in ${SOURCE}/ yet. Name each photo after its place (see ${SOURCE}/README.txt).\n`,
  );
  process.exit(0);
}

for (const old of await readdir(OUTPUT)) {
  if (old.endsWith(".webp")) await rm(path.join(OUTPUT, old));
}

const done = new Set();
let made = 0;
for (const file of entries) {
  const ext = path.extname(file).toLowerCase();
  const slot = slugify(file);
  if (!ALLOWED.has(ext)) {
    console.log(`- Skipped ${file}: use JPEG, PNG, WebP or AVIF.`);
    continue;
  }
  if (!validSlots.includes(slot)) {
    console.log(
      `✗ ${file}: "${slot}" is not a place on the website.${closest(slot)} See README.txt for the names.`,
    );
    continue;
  }
  if (done.has(slot)) {
    console.log(`- Skipped ${file}: there is already a photo for "${slot}".`);
    continue;
  }
  try {
    const upright = await sharp(path.join(SOURCE, file)).rotate().toBuffer();
    const meta = await sharp(upright).metadata();
    const { widths, ratio } = sizeFor(slot);
    const parts = [];
    for (const width of widths) {
      const outWidth = Math.min(
        width,
        meta.width ?? width,
        Math.round((meta.height ?? width) * ratio),
      );
      const outHeight = Math.round(outWidth / ratio);
      const target = path.join(OUTPUT, `${slot}-${width}.webp`);
      await sharp(upright)
        .resize({
          width: outWidth,
          height: outHeight,
          fit: "cover",
          position: sharp.strategy.attention,
        })
        .webp({ quality: 72 })
        .toFile(target);
      parts.push(`${width}px: ${kb((await stat(target)).size)}`);
    }
    done.add(slot);
    made += 1;
    console.log(
      `✓ ${file} -> ${slot}  [${parts.join(", ")}]${(meta.width ?? 0) < 900 ? "  (small photo: may look soft)" : ""}`,
    );
  } catch {
    console.log(`✗ ${file}: could not be read. Save it again as a normal JPEG or PNG.`);
  }
}

const missing = validSlots.filter((slot) => !done.has(slot));
console.log(
  `\nDone. ${made} photo(s) ready. Places still without a photo (that is fine): ${missing.length}`,
);
console.log("Restart npm run dev to see them.\n");
