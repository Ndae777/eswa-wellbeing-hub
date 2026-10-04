// Server-side Supabase client that uses the PUBLISHABLE key only (the same
// permissions as a visitor's browser). No secret or service-role key is needed,
// so a leak of this server cannot expose more than the public site already can.
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

function isNewKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function withApiKey(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((value, name) => headers.set(name, value));
    }
    if (isNewKey(key) && headers.get("Authorization") === `Bearer ${key}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

export function createServerSupabase() {
  const url = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] || process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    global: { fetch: withApiKey(key) },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
