// Small in-memory rate limiter shared by the form routes.
// Best effort only: each server copy on Netlify keeps its own counts.
// It stops casual spam and accidents. Real protection comes from the database
// rules and, later, a bot check such as Cloudflare Turnstile.

export type Limiter = {
  tooMany: (key: string) => boolean;
};

export function createLimiter(maxHits: number, windowMs: number): Limiter {
  const hitsByKey = new Map<string, number[]>();

  function prune(now: number) {
    for (const [key, hits] of hitsByKey) {
      const kept = hits.filter((time) => now - time < windowMs);
      if (kept.length === 0) hitsByKey.delete(key);
      else hitsByKey.set(key, kept);
    }
  }

  return {
    tooMany(key: string): boolean {
      const now = Date.now();
      if (hitsByKey.size > 5000) prune(now);
      const recent = (hitsByKey.get(key) ?? []).filter((time) => now - time < windowMs);
      if (recent.length >= maxHits) {
        hitsByKey.set(key, recent);
        return true;
      }
      hitsByKey.set(key, [...recent, now]);
      return false;
    },
  };
}

// Works out who is calling. The x-forwarded-for header can be faked by the
// caller (they can write anything at the start of it), so we prefer the headers
// set by the hosting platform, then the LAST entry of x-forwarded-for, which is
// the one added by the platform's own proxy.
export function clientAddress(request: Request): string {
  const headers = request.headers;
  const platform = headers.get("x-nf-client-connection-ip") ?? headers.get("cf-connecting-ip");
  if (platform) return platform.trim();
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) return last;
  }
  return headers.get("x-real-ip") ?? "local";
}

export function jsonResponse(body: unknown, status = 200, extraHeaders?: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });
}
