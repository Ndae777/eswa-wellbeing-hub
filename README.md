# ESWA Wellbeing Hub

The ESWA (Educator Support and Wellness Alliance) Wellbeing Hub is a production-ready
TanStack Start application for educator wellbeing programmes: workshop listings and
registration, a staff dashboard with attendance tracking and Excel exports, a feedback
questionnaire, mental health resources, and an AI wellness assistant.

Stack: **TanStack Start + React 19 + Vite + Nitro** (frontend/SSR) ·
**Supabase** (database, auth, RLS) · **OpenAI** (server-side chat, optional).

---

## 1. Local development

```bash
npm install          # Node 22+ (see .nvmrc)
cp .env.example .env # then fill in your Supabase + OpenAI values
npm run dev          # http://localhost:3000
```

Other scripts: `npm run build` (production build to `.output/`) ·
`npm start` (serve the production build) · `npm run typecheck` · `npm run lint`.

## 2. Supabase setup (one-time)

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine).
2. Open the **SQL Editor** and run the full contents of
   [`supabase/migrations/0000_eswa_core_schema.sql`](supabase/migrations/0000_eswa_core_schema.sql).
   This creates all tables, RLS policies, helper functions and seed workshops.
3. **Authentication → Providers**: enable **Email**. Under *URL Configuration* set
   the Site URL to your production domain and add `http://localhost:3000` for local dev.
4. Update the admin allowlist: replace the seed email in `public.staff_allowlist`
   with the real administrator's email — anyone on that list gets the admin role
   automatically on signup:

   ```sql
   UPDATE public.staff_allowlist SET email = 'admin@your-npo.org.za'
   WHERE email = 'zongwana.sesethu@gmail.com';
   ```

5. Copy the project URL and keys into your environment (see below).

**Key safety rule:** the browser only ever gets the *publishable* key (`VITE_SUPABASE_*`).
The service-role key is server-only and must never be prefixed with `VITE_`.

## 3. Environment variables

See [`.env.example`](.env.example) for the full annotated list. Minimum for production:

| Variable | Scope | Purpose |
| --- | --- | --- |
| `SUPABASE_URL` | server | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | server | Supabase publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | server | Admin operations (bypasses RLS) |
| `OPENAI_API_KEY` | server | Powers `/api/chat` (optional — route returns 503 without it) |
| `OPENAI_MODEL` | server | Defaults to `gpt-4o-mini` |
| `VITE_SUPABASE_URL` | client | Same project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | client | Publishable key only |
| `VITE_SUPABASE_PROJECT_ID` | client | Project reference ID |
| `VITE_PUBLIC_APP_URL` | client | Public origin (presentation/live-demo page) |
| `NITRO_PRESET` | build | `node-server` (default), `vercel`, `netlify`, `cloudflare-module`… |
| `PORT` | runtime | HTTP port for `npm start` (default 3000) |

## 4. Deployment

### Option A — Vercel / Netlify (recommended, zero-ops)

1. Push this repo to GitHub/GitLab and import it in Vercel or Netlify.
2. Build command `npm run build` is already configured (see `vercel.json`).
   Nitro auto-detects the platform — set `NITRO_PRESET=vercel` or `netlify` only
   if auto-detection doesn't kick in.
3. Add all environment variables from section 3 in the host's dashboard
   (server-only vars must NOT be exposed to the client bundle).
4. Attach the NPO's domain; HTTPS is managed by the platform.

### Option B — Docker / VPS (full control)

```bash
docker build -t eswa-wellbeing-hub .
docker run -d -p 3000:3000 --env-file .env --name eswa eswa-wellbeing-hub
```

The image runs as a non-root user, exposes port 3000 and includes a health check
against `/api/health`. Put Caddy or nginx in front for TLS.

### Option C — Cloudflare / other Nitro presets

Set `NITRO_PRESET=cloudflare-module` (or any other
[Nitro preset](https://nitro.build/deploy)) and follow that platform's guide.

## 5. Post-launch checklist

- [ ] `/api/health` returns `{"status":"ok"}` (point UptimeRobot at it)
- [ ] Admin can sign in, view registrations/feedback, and export the Excel file
- [ ] Public can register for a workshop and submit feedback
- [ ] `/api/chat` responds (and rate-limits after ~20 rapid requests → 429)
- [ ] Security headers present (`curl -sI https://your-domain | grep -i x-frame`)
- [ ] OpenAI usage budget + billing alerts configured
- [ ] Replace the placeholder domain in `public/sitemap.xml` and `public/robots.txt`
- [ ] Optional but recommended: point error tracking (Sentry free tier) at the app

## 6. Security & abuse notes

- `/api/chat` is rate-limited (20 req/min/IP), payload-capped, and returns a
  graceful message (with SADAG crisis line) if OpenAI fails.
- Security headers (HSTS in production, `X-Frame-Options`, `nosniff`,
  `Referrer-Policy`, `Permissions-Policy`) are set in `vite.config.ts`.
- All database access is protected by Supabase RLS; the staff dashboard requires
  the admin role granted via the email allowlist.
- Server functions are CSRF-protected via TanStack Start middleware.

## Notes

- The Excel export on the staff dashboard uses SpreadsheetML (opens natively in
  Excel/LibreOffice) — the app intentionally has no `xlsx` dependency.
- The project contains no Lovable runtime dependency and no preview-auth storage.
- `sourcemap: "hidden"` is enabled — upload source maps to your error tracker if used.
