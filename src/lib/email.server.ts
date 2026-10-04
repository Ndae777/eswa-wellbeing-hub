// Sends email through Resend (https://resend.com) using plain fetch.
// Needs two settings on the server:
//   RESEND_API_KEY  (secret)
//   EMAIL_FROM      for example:  ESWA <hello@yourdomain.org.za>
// Optional: NOTIFY_EMAIL, where ESWA staff get a copy of each new registration and feedback.
// Without the first two, nothing is sent and the site says so honestly.

export type EmailResult = "sent" | "not_configured" | "failed";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type Message = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string | undefined;
  attachments?: { filename: string; content: string }[] | undefined;
};

export function emailIsConfigured(): boolean {
  return Boolean(process.env["RESEND_API_KEY"] && process.env["EMAIL_FROM"]);
}

export async function sendEmail(message: Message): Promise<EmailResult> {
  const apiKey = process.env["RESEND_API_KEY"];
  const from = process.env["EMAIL_FROM"];
  if (!apiKey || !from) {
    console.warn("[email] Not sent: RESEND_API_KEY or EMAIL_FROM is not set.");
    return "not_configured";
  }

  try {
    const endpoint = process.env["RESEND_API_URL"] || "https://api.resend.com/emails";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
        ...(message.attachments ? { attachments: message.attachments } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(
        `[email] Resend refused the message (status ${response.status}): ${detail.slice(0, 300)}`,
      );
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.error("[email] Could not reach Resend:", error);
    return "failed";
  }
}

// Workshop times are always shown in South African time, wherever the server runs.
export function formatSaTime(iso: string): string {
  return new Date(iso).toLocaleString("en-ZA", {
    timeZone: "Africa/Johannesburg",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Calendar invite (.ics) so the workshop lands in the teacher's calendar.
// ---------------------------------------------------------------------------

function icsEscape(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function icsTime(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

export function buildCalendarInvite(input: {
  uid: string;
  title: string;
  startsAt: string;
  durationMinutes: number;
  location: string;
  notes: string;
}): string {
  const start = new Date(input.startsAt);
  const end = new Date(start.getTime() + input.durationMinutes * 60_000);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ESWA//Wellbeing Hub//EN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${input.uid}@eswa-wellbeing-hub`,
    `DTSTAMP:${icsTime(new Date())}`,
    `DTSTART:${icsTime(start)}`,
    `DTEND:${icsTime(end)}`,
    `SUMMARY:${icsEscape(input.title)}`,
    `LOCATION:${icsEscape(input.location)}`,
    `DESCRIPTION:${icsEscape(input.notes)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

// The public web address, used for links inside emails. We read it from settings
// and never from the incoming request, so nobody can make our emails point at
// another website.
export function publicSiteUrl(): string | null {
  const value = process.env["VITE_PUBLIC_APP_URL"] ?? "";
  if (!/^https:\/\/[^\s/]+$/.test(value.replace(/\/$/, ""))) return null;
  return value.replace(/\/$/, "");
}
