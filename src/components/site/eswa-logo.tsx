export function EswaLogo({ className }: { className?: string }) {
  return (
    <span className={className}>
      <svg viewBox="0 0 28 28" className="h-7 w-7 shrink-0" aria-hidden="true">
        <path
          d="M14 25c0-7 3-12 9-15-1 8-4 12-9 15Z"
          fill="currentColor"
          opacity="0.85"
        />
        <path d="M13 25C13 17 9 11 3 8c1 9 4 14 10 17Z" fill="currentColor" opacity="0.55" />
      </svg>
    </span>
  );
}
