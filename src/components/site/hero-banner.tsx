import { useEffect, useMemo, useState, type ReactNode } from "react";

// Every photo prepared by `npm run hero-images` lands in src/assets/hero as
// <name>-800.webp and <name>-1600.webp. We find them automatically, so adding or
// removing photos never needs a code change.
const heroFiles = import.meta.glob("/src/assets/hero/*.webp", {
  eager: true,
  query: "?no-inline",
  import: "default",
}) as { [path: string]: string };

type Slide = { name: string; small: string; large: string };

function buildSlides(): Slide[] {
  const byName = new Map<string, { small?: string; large?: string }>();
  for (const [filePath, url] of Object.entries(heroFiles)) {
    const match = /\/([^/]+)-(800|1600)\.webp$/.exec(filePath);
    if (!match) continue;
    const name = match[1] ?? "";
    const entry = byName.get(name) ?? {};
    if (match[2] === "800") entry.small = url;
    else entry.large = url;
    byName.set(name, entry);
  }
  return [...byName.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, urls]) => ({
      name,
      small: urls.small ?? urls.large ?? "",
      large: urls.large ?? urls.small ?? "",
    }))
    .filter((slide) => slide.small !== "");
}

const SECONDS_PER_SLIDE = 7;

export function HeroBanner({ children }: { children: ReactNode }) {
  const slides = useMemo(buildSlides, []);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setActive((current) => (current + 1) % slides.length);
      }
    }, SECONDS_PER_SLIDE * 1000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <section
      className={`hero-banner bg-hero-gradient ${slides.length > 0 ? "hero-has-photos" : ""}`}
    >
      {/* Soft moving shapes: always shown, even before any photo is added. */}
      <div className="hero-blobs" aria-hidden="true">
        <span className="hero-blob hero-blob-a" />
        <span className="hero-blob hero-blob-b" />
        <span className="hero-blob hero-blob-c" />
      </div>

      {/* Photos fade into each other. They are decoration, so screen readers skip them. */}
      {slides.length > 0 && (
        <div className="hero-photos" aria-hidden="true">
          {slides.map((slide, index) => (
            <img
              key={slide.name}
              src={slide.large}
              srcSet={`${slide.small} 800w, ${slide.large} 1600w`}
              sizes="100vw"
              alt=""
              decoding="async"
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "auto"}
              className={`hero-photo ${index === active ? "hero-photo-active" : ""}`}
            />
          ))}
        </div>
      )}

      {/* Keeps the words easy to read on top of any photo. */}
      <div className="hero-scrim" aria-hidden="true" />

      <div className="hero-content mx-auto max-w-6xl px-4 pb-16 pt-12 sm:pt-20">{children}</div>
    </section>
  );
}
