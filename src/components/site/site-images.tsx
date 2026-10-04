import type { ReactNode } from "react";

import { programmes } from "@/lib/eswa-content";

// Photos prepared by `npm run images` end up in src/assets/site, named after the
// place they belong to, for example card-workshops-480.webp. We find them
// automatically. A place with no photo simply shows nothing.
const files = import.meta.glob("/src/assets/site/*.webp", {
  eager: true,
  query: "?no-inline",
  import: "default",
}) as { [path: string]: string };

type Variant = { width: number; url: string };
const bySlot = new Map<string, Variant[]>();
for (const [filePath, url] of Object.entries(files)) {
  const match = /\/([^/]+)-(\d+)\.webp$/.exec(filePath);
  if (!match) continue;
  const slot = match[1] ?? "";
  const list = bySlot.get(slot) ?? [];
  list.push({ width: Number(match[2]), url });
  bySlot.set(
    slot,
    list.sort((a, b) => a.width - b.width),
  );
}

export function hasSiteImage(slot: string): boolean {
  return bySlot.has(slot);
}

function srcSetFor(variants: Variant[]): string {
  return variants.map((variant) => `${variant.url} ${variant.width}w`).join(", ");
}

// Finds the programme photo slot that matches a workshop's programme name.
export function programmeSlot(programmeName: string | null | undefined): string | null {
  const match = programmes.find(
    (programme) => programme.title.toLowerCase() === (programmeName ?? "").toLowerCase(),
  );
  return match ? `programme-${match.slug}` : null;
}

// A photo across the top of a card. Put it inside an element with the card-surface
// class: it sits flush against the card edges.
export function CardImage({
  slot,
  sizes = "(min-width: 1024px) 380px, 90vw",
}: {
  slot: string | null;
  sizes?: string;
}) {
  const variants = slot ? bySlot.get(slot) : undefined;
  if (!variants || variants.length === 0) return null;
  const largest = variants[variants.length - 1];
  return (
    <div className="-mx-6 -mt-6 mb-5 overflow-hidden rounded-t-[inherit] bg-secondary">
      <img
        src={largest?.url}
        srcSet={srcSetFor(variants)}
        sizes={sizes}
        alt=""
        loading="lazy"
        decoding="async"
        className="aspect-[3/2] w-full object-cover transition duration-500 group-hover:scale-105"
      />
    </div>
  );
}

// A small photo shown beside a workshop (hidden on phones to save data).
export function ThumbImage({ slot }: { slot: string | null }) {
  const variants = slot ? bySlot.get(slot) : undefined;
  if (!variants || variants.length === 0) return null;
  return (
    <img
      src={variants[0]?.url}
      alt=""
      loading="lazy"
      decoding="async"
      className="hidden aspect-[3/2] w-40 flex-none rounded-lg object-cover sm:block"
    />
  );
}

// A wide photo with a rounded frame, for the About page.
export function WideImage({ slot }: { slot: string }) {
  const variants = bySlot.get(slot);
  if (!variants || variants.length === 0) return null;
  const largest = variants[variants.length - 1];
  return (
    <figure className="overflow-hidden rounded-2xl bg-secondary shadow-soft">
      <img
        src={largest?.url}
        srcSet={srcSetFor(variants)}
        sizes="(min-width: 896px) 896px, 100vw"
        alt=""
        loading="lazy"
        decoding="async"
        className="aspect-[21/9] w-full object-cover"
      />
    </figure>
  );
}

// The coloured page header. With a photo it fades in softly behind the title;
// without one it looks exactly like before.
export function PageBanner({ slot, children }: { slot: string; children: ReactNode }) {
  const variants = bySlot.get(slot);
  const largest = variants?.[variants.length - 1];
  if (!variants || !largest) return <section className="bg-hero-gradient">{children}</section>;
  return (
    <section className="hero-banner hero-has-photos bg-hero-gradient">
      <div className="hero-photos" aria-hidden="true">
        <img
          src={largest.url}
          srcSet={srcSetFor(variants)}
          sizes="100vw"
          alt=""
          decoding="async"
          className="hero-photo hero-photo-active"
        />
      </div>
      <div className="hero-scrim" aria-hidden="true" />
      <div className="relative">{children}</div>
    </section>
  );
}
