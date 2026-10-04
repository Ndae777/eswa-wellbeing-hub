import { createFileRoute } from "@tanstack/react-router";

import { isUuid, validateRegistration } from "@/lib/validation";

// Codes the page turns into friendly sentences.
type Failure =
  | "too_many"
  | "bad_request"
  | "invalid"
  | "already_registered"
  | "workshop_full"
  | "workshop_unavailable"
  | "workshop_closed"
  | "unavailable";

function fail(
  json: (body: unknown, status?: number, headers?: HeadersInit) => Response,
  code: Failure,
  status: number,
  extra?: { errors?: unknown },
): Response {
  return json({ ok: false, code, ...extra }, status);
}

export const Route = createFileRoute("/api/register")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { createLimiter, clientAddress, jsonResponse } =
          await import("@/lib/rate-limit.server");
        const email = await import("@/lib/email.server");
        const { createServerSupabase } = await import("@/lib/supabase-anon.server");

        // One limiter per server copy, created on first use.
        const g = globalThis as unknown as {
          __eswaRegisterLimiters?: {
            byAddress: ReturnType<typeof createLimiter>;
            byEmail: ReturnType<typeof createLimiter>;
          };
        };
        g.__eswaRegisterLimiters ??= {
          byAddress: createLimiter(8, 10 * 60_000),
          byEmail: createLimiter(5, 60 * 60_000),
        };
        const limiters = g.__eswaRegisterLimiters;

        if (limiters.byAddress.tooMany(clientAddress(request))) {
          return fail(jsonResponse, "too_many", 429);
        }

        const declared = Number(request.headers.get("content-length") ?? 0);
        if (declared > 20_000) return fail(jsonResponse, "bad_request", 413);

        let body: { [key: string]: unknown };
        try {
          body = (await request.json()) as { [key: string]: unknown };
        } catch {
          return fail(jsonResponse, "bad_request", 400);
        }

        // Hidden "website" field: real people never fill it in, bots often do.
        // Pretend it worked so the bot learns nothing.
        if (typeof body["website"] === "string" && body["website"].trim() !== "") {
          return jsonResponse({ ok: true, emailStatus: "not_sent" });
        }

        const workshopId = body["workshop_id"];
        if (!isUuid(workshopId)) return fail(jsonResponse, "workshop_unavailable", 404);

        const { values, errors } = validateRegistration(body);
        if (Object.keys(errors).length > 0) {
          return fail(jsonResponse, "invalid", 422, { errors });
        }

        const supabase = createServerSupabase();
        if (!supabase) {
          console.error("[/api/register] Supabase settings are missing on the server.");
          return fail(jsonResponse, "unavailable", 503);
        }

        const { data: workshop, error: workshopError } = await supabase
          .from("workshops")
          .select("id, title, starts_at, duration_minutes, location, facilitator")
          .eq("id", workshopId)
          .maybeSingle();
        if (workshopError) {
          console.error("[/api/register] could not read workshop:", workshopError.message);
          return fail(jsonResponse, "unavailable", 503);
        }
        if (!workshop) return fail(jsonResponse, "workshop_unavailable", 404);

        // Secret link token for cancelling. Created here so we can put it in the email.
        const cancelToken = crypto.randomUUID();

        const { error: insertError } = await supabase.from("registrations").insert({
          cancel_token: cancelToken,
          workshop_id: workshop.id,
          full_name: values.full_name,
          email: values.email,
          phone: values.phone || null,
          school: values.school || null,
          role_at_school: values.role_at_school || null,
          province: values.province || null,
          dietary_or_access_needs: values.dietary_or_access_needs || null,
        });

        if (insertError) {
          const text = `${insertError.message} ${insertError.code ?? ""}`;
          if (insertError.code === "23505") return fail(jsonResponse, "already_registered", 409);
          if (text.includes("workshop_full")) return fail(jsonResponse, "workshop_full", 409);
          if (text.includes("workshop_closed")) return fail(jsonResponse, "workshop_closed", 409);
          if (text.includes("workshop_unavailable")) {
            return fail(jsonResponse, "workshop_unavailable", 409);
          }
          if (/invalid_email|invalid_name|field_too_long/.test(text)) {
            return fail(jsonResponse, "invalid", 422, {
              errors: { email: "Please check your details and try again." },
            });
          }
          console.error("[/api/register] insert failed:", insertError.message);
          return fail(jsonResponse, "unavailable", 503);
        }

        // The seat is saved. Now fetch the private joining details (Teams link,
        // directions) using the token, then send the emails. A failed email never
        // undoes the seat.
        const { data: mine } = await supabase.rpc("get_registration_by_token", {
          p_token: cancelToken,
        });
        const joiningDetails = mine?.[0]?.joining_details ?? null;

        const siteUrl = email.publicSiteUrl();
        const cancelLink = siteUrl ? `${siteUrl}/cancel/${cancelToken}` : null;

        let emailStatus: "sent" | "not_sent" = "not_sent";
        if (!limiters.byEmail.tooMany(values.email)) {
          const when = email.formatSaTime(workshop.starts_at);
          const safeName = email.escapeHtml(values.full_name);
          const safeTitle = email.escapeHtml(workshop.title);
          const safeWhere = email.escapeHtml(workshop.location);
          const contactEmail = process.env["NOTIFY_EMAIL"] ?? "";
          const row = (label: string, value: string) =>
            `<tr><td style="padding:4px 14px 4px 0;color:#6b7280;vertical-align:top">${label}</td><td>${value}</td></tr>`;

          const invite = email.buildCalendarInvite({
            uid: cancelToken,
            title: workshop.title,
            startsAt: workshop.starts_at,
            durationMinutes: workshop.duration_minutes,
            location: workshop.location,
            notes:
              joiningDetails ?? "Organised by the Educator Support and Wellness Alliance (ESWA).",
          });

          const textLines = [
            `Hello ${values.full_name},`,
            "",
            `Your seat is reserved for "${workshop.title}".`,
            "",
            `When: ${when} (South African time)`,
            `Length: ${workshop.duration_minutes} minutes`,
            `Where: ${workshop.location}`,
            ...(joiningDetails ? ["", "How to join:", joiningDetails] : []),
            "",
            "A calendar file is attached. Open it to add the workshop to your calendar.",
            ...(cancelLink
              ? ["", "Can't make it? Please cancel so someone else can take your seat:", cancelLink]
              : ["", "Can't make it? Please reply to this email so we can free your seat."]),
            "",
            "Educator Support and Wellness Alliance (ESWA)",
            "Wellness for Teachers. Success for Learners.",
          ];

          const result = await email.sendEmail({
            to: values.email,
            replyTo: contactEmail || undefined,
            subject: `You're registered: ${workshop.title}`,
            text: textLines.join("\n"),
            attachments: [
              {
                filename: "eswa-workshop.ics",
                content: Buffer.from(invite, "utf-8").toString("base64"),
              },
            ],
            html:
              `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1f2937;line-height:1.55">` +
              `<h2 style="margin:0 0 12px">You're registered</h2>` +
              `<p>Hello ${safeName},</p>` +
              `<p>Your seat is reserved for <strong>${safeTitle}</strong>.</p>` +
              `<table style="border-collapse:collapse;margin:16px 0">` +
              row("When", `${email.escapeHtml(when)} (South African time)`) +
              row("Length", `${workshop.duration_minutes} minutes`) +
              row("Where", safeWhere) +
              (joiningDetails
                ? row("How to join", email.escapeHtml(joiningDetails).replace(/\n/g, "<br>"))
                : "") +
              `</table>` +
              `<p>A calendar file is attached. Open it to add the workshop to your calendar.</p>` +
              (cancelLink
                ? `<p>Can't make it? Please <a href="${cancelLink}">cancel your seat</a> so someone else can take it.</p>`
                : `<p>Can't make it? Please reply to this email so we can free your seat.</p>`) +
              `<p style="color:#6b7280;font-size:13px">Educator Support and Wellness Alliance (ESWA)<br>Wellness for Teachers. Success for Learners.</p>` +
              `</div>`,
          });
          emailStatus = result === "sent" ? "sent" : "not_sent";

          // Copy to ESWA staff, if an address is set. Errors here are ignored.
          if (contactEmail) {
            await email.sendEmail({
              to: contactEmail,
              subject: `New registration: ${workshop.title}`,
              text:
                `${values.full_name} (${values.email}) registered for "${workshop.title}".\n` +
                `School: ${values.school || "not given"}\nProvince: ${values.province || "not given"}`,
              html:
                `<p><strong>${safeName}</strong> (${email.escapeHtml(values.email)}) registered for <strong>${safeTitle}</strong>.</p>` +
                `<p>School: ${email.escapeHtml(values.school || "not given")}<br>Province: ${email.escapeHtml(values.province || "not given")}</p>`,
            });
          }
        }

        return jsonResponse({ ok: true, emailStatus, cancelToken, joiningDetails });
      },
    },
  },
});
