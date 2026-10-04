import { createFileRoute } from "@tanstack/react-router";

import { validateFeedback } from "@/lib/validation";

export const Route = createFileRoute("/api/feedback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { createLimiter, clientAddress, jsonResponse } =
          await import("@/lib/rate-limit.server");
        const email = await import("@/lib/email.server");
        const { createServerSupabase } = await import("@/lib/supabase-anon.server");

        const g = globalThis as unknown as {
          __eswaFeedbackLimiter?: ReturnType<typeof createLimiter>;
        };
        g.__eswaFeedbackLimiter ??= createLimiter(6, 10 * 60_000);

        if (g.__eswaFeedbackLimiter.tooMany(clientAddress(request))) {
          return jsonResponse({ ok: false, code: "too_many" }, 429);
        }

        const declared = Number(request.headers.get("content-length") ?? 0);
        if (declared > 30_000) return jsonResponse({ ok: false, code: "bad_request" }, 413);

        let body: { [key: string]: unknown };
        try {
          body = (await request.json()) as { [key: string]: unknown };
        } catch {
          return jsonResponse({ ok: false, code: "bad_request" }, 400);
        }

        // Hidden field that only bots fill in.
        if (typeof body["website"] === "string" && body["website"].trim() !== "") {
          return jsonResponse({ ok: true });
        }

        const { values, errors } = validateFeedback(body);
        if (Object.keys(errors).length > 0) {
          return jsonResponse({ ok: false, code: "invalid", errors }, 422);
        }

        const supabase = createServerSupabase();
        if (!supabase) {
          console.error("[/api/feedback] Supabase settings are missing on the server.");
          return jsonResponse({ ok: false, code: "unavailable" }, 503);
        }

        const { error } = await supabase.from("feedback").insert({
          workshop_id: values.workshop_id || null,
          full_name: values.full_name || null,
          email: values.email || null,
          school: values.school || null,
          role_at_school: values.role_at_school || null,
          overall_rating: values.overall_rating as number,
          stress_level: values.stress_level,
          wellbeing_before: values.wellbeing_before,
          wellbeing_after: values.wellbeing_after,
          would_recommend: values.would_recommend,
          most_valuable: values.most_valuable || null,
          improvements: values.improvements || null,
          future_topics: values.future_topics || null,
        });

        if (error) {
          console.error("[/api/feedback] insert failed:", error.message);
          return jsonResponse({ ok: false, code: "unavailable" }, 503);
        }

        // Tell ESWA staff, if a notification address is set. The visitor never
        // gets an email from the feedback form, so nobody can use it to send mail
        // to someone else's address.
        const notify = process.env["NOTIFY_EMAIL"];
        if (notify) {
          const lines = [
            `Overall rating: ${values.overall_rating}/5`,
            values.most_valuable ? `Most valuable: ${values.most_valuable}` : "",
            values.improvements ? `Improve: ${values.improvements}` : "",
            values.future_topics ? `Future topics: ${values.future_topics}` : "",
          ].filter(Boolean);
          await email.sendEmail({
            to: notify,
            subject: `New feedback: ${values.overall_rating}/5`,
            text: lines.join("\n"),
            html: lines.map((line) => `<p>${email.escapeHtml(line)}</p>`).join(""),
          });
        }

        return jsonResponse({ ok: true });
      },
    },
  },
});
