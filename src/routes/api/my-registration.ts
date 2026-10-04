import { createFileRoute } from "@tanstack/react-router";

import { isUuid } from "@/lib/validation";

// Used by the cancel page. The secret link token proves who the person is.
// POST { token, action: "view" | "cancel" }
export const Route = createFileRoute("/api/my-registration")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { createLimiter, clientAddress, jsonResponse } =
          await import("@/lib/rate-limit.server");
        const { createServerSupabase } = await import("@/lib/supabase-anon.server");

        const g = globalThis as unknown as {
          __eswaCancelLimiter?: ReturnType<typeof createLimiter>;
        };
        g.__eswaCancelLimiter ??= createLimiter(30, 10 * 60_000);
        if (g.__eswaCancelLimiter.tooMany(clientAddress(request))) {
          return jsonResponse({ ok: false, code: "too_many" }, 429);
        }

        const declared = Number(request.headers.get("content-length") ?? 0);
        if (declared > 2_000) return jsonResponse({ ok: false, code: "bad_request" }, 413);

        let body: { [key: string]: unknown };
        try {
          body = (await request.json()) as { [key: string]: unknown };
        } catch {
          return jsonResponse({ ok: false, code: "bad_request" }, 400);
        }

        const token = body["token"];
        if (!isUuid(token)) return jsonResponse({ ok: false, code: "not_found" }, 404);

        const supabase = createServerSupabase();
        if (!supabase) return jsonResponse({ ok: false, code: "unavailable" }, 503);

        if (body["action"] === "cancel") {
          const { data, error } = await supabase.rpc("cancel_registration", { p_token: token });
          if (error) {
            console.error("[/api/my-registration] cancel failed:", error.message);
            return jsonResponse({ ok: false, code: "unavailable" }, 503);
          }
          if (data === "cancelled") return jsonResponse({ ok: true });
          return jsonResponse({ ok: false, code: data === "closed" ? "closed" : "not_found" }, 409);
        }

        const { data, error } = await supabase.rpc("get_registration_by_token", { p_token: token });
        if (error) {
          console.error("[/api/my-registration] lookup failed:", error.message);
          return jsonResponse({ ok: false, code: "unavailable" }, 503);
        }
        const found = data?.[0];
        if (!found) return jsonResponse({ ok: false, code: "not_found" }, 404);
        return jsonResponse({
          ok: true,
          registration: {
            name: found.full_name,
            title: found.title,
            startsAt: found.starts_at,
            durationMinutes: found.duration_minutes,
            location: found.location,
            joiningDetails: found.joining_details,
            isPast: found.is_past,
          },
        });
      },
    },
  },
});
