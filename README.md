# ESWA Wellbeing Hub

The website of the **Educator Support and Wellness Alliance (ESWA)**, a South African
non-profit that supports teachers and school leaders. Built by a volunteer student team.

**Live site:** https://eswa-wellbeing.netlify.app/

> This is a test deployment. Please do not enter real personal information
> (names, emails, phone numbers) in the forms or the chat.

---

## About the project

Teachers carry heavy workloads, and support is often hard to reach. The Wellbeing Hub gives
ESWA one place to run its work online:

- **Workshops:** listings, a calendar, and free registration with live seat counts.
- **Feedback:** a short questionnaire so ESWA can see what is working.
- **Mental health resources:** South African helplines and self-care information.
- **Wellness chat:** an AI helper that only answers questions about ESWA and educator
  wellbeing. Crisis messages get a fixed reply with helpline numbers.
- **Staff dashboard:** admins review registrations and feedback, mark attendance and
  export to Excel.

Status: pilot, under testing. Costs, staff steps and the security plan are tracked in the
team's handover documents.

## Tech stack

- TanStack Start and Router (file-based routes), React 19, Vite, Nitro (server rendering)
- Tailwind CSS and shadcn/ui
- Supabase: Postgres database, staff login and row-level security
- Vercel AI SDK with Google Gemini for the chat (server-side only)
- Hosting: Netlify (a Docker image is also included)

## Run it locally

You need Node 22 or newer (see `.nvmrc`).

```bash
npm install
cp .env.example .env     # then fill in the values (see below)
npm run dev              # http://localhost:3000
```

Restart `npm run dev` after any change to `.env`.

Other scripts: `npm run typecheck` · `npm run lint` · `npm run build` · `npm start`
(serves the built app; used by the Docker image).

## Environment variables

Copy `.env.example` to `.env`. The `.env` file is ignored by git. **Never commit it or
share it.** On Netlify, set the same names under Site configuration, Environment variables.

| Variable                        | Used by | Purpose                                                                        |
| ------------------------------- | ------- | ------------------------------------------------------------------------------ |
| `SUPABASE_URL`                  | server  | Project URL, for example `https://abc.supabase.co`. Nothing after `.co`.       |
| `SUPABASE_PUBLISHABLE_KEY`      | server  | Supabase publishable (anon) key                                                |
| `VITE_SUPABASE_URL`             | browser | Same project URL                                                               |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | browser | Same publishable key                                                           |
| `VITE_SUPABASE_PROJECT_ID`      | browser | Project reference (the part before `.supabase.co`)                             |
| `GEMINI_API_KEY`                | server  | Powers `/api/chat`. Without it the chat returns 503.                           |
| `GEMINI_MODEL`                  | server  | Defaults to `gemini-3.1-flash-lite`. Check the name is available for your key. |
| `CHAT_DAILY_CAP`                | server  | Optional. Total chat messages per day. Defaults to 400.                        |
| `VITE_PUBLIC_APP_URL`           | browser | Public address of the site                                                     |
| `SUPABASE_SERVICE_ROLE_KEY`     | server  | Optional and unused by current pages. Never prefix it with `VITE_`.            |
| `NITRO_PRESET`                  | build   | `node-server` by default. `netlify.toml` sets `netlify`.                       |

`VITE_` values are baked in at build time. After changing one on Netlify, redeploy with
**Clear cache and deploy site**.

## Supabase setup (one time)

1. Create a project at [supabase.com](https://supabase.com). Use the Pro plan for real use:
   the free plan pauses after a week of inactivity and has no backups.
2. In **SQL Editor**, run these files in order:
   - `supabase/migrations/0000_eswa_core_schema.sql` (tables, security rules, seed workshops)
   - `supabase/migrations/0001_registration_rules.sql` (seat limits and input checks)
3. In **Authentication**:
   - Turn **off** "Allow new users to sign up". Staff accounts are invite-only.
   - Under URL Configuration, set the Site URL to the live address and add the same
     address followed by `/**` to Redirect URLs (and `http://localhost:3000/**` for local work).
   - Add your own email sending service before launch. The built-in sender is for testing only.
4. Put the project URL and publishable key into your environment variables.

### Adding and removing staff

Staff access is only granted when an account is created, and only to emails already on the
allowlist. Do the steps in this order.

1. SQL Editor, run (with the new person's email):

   ```sql
   insert into public.staff_allowlist (email) values ('name@example.org') on conflict do nothing;
   ```

2. Authentication, Users, Add user, Create new user. Enter the same email and a temporary
   password, and tick **Auto Confirm User**.
3. The person opens `/staff`, enters their email, and uses **Forgot password?** to choose
   their own password.

To remove someone, delete the user under Authentication, Users, and run:

```sql
delete from public.staff_allowlist where email = 'name@example.org';
```

## Deploying to Netlify

1. Push the repository to GitHub and import it in Netlify.
2. `netlify.toml` already sets the build command, the publish folder (`dist`), Node 22 and
   `NITRO_PRESET=netlify`. Nitro does **not** switch to Netlify mode on its own.
3. Add the environment variables above, then deploy.
4. Check `https://your-site/api/health` returns `{"status":"ok", ...}`.

Other options: build the included `Dockerfile` for a server you maintain. Vercel's free plan
is non-commercial only, and Cloudflare Workers needs code changes (the chat route starts a
timer at module level), so neither is set up.

## The AI chat

`/api/chat` runs on the server and the key never reaches the browser.

- The system prompt limits it to ESWA and educator wellbeing. Other topics get a fixed
  redirect line.
- Crisis phrases get a fixed reply with South African helplines and never reach the model.
- Only plain user and assistant text is accepted. Messages are length-limited and fake
  `system` messages are dropped.
- Limits: 12 requests per minute per visitor and a daily total cap. These are held in memory
  per server copy, so on Netlify they are best effort. Set a budget alert in Google Cloud.
- Use Gemini's **paid tier** for real use. On the free tier Google may use chat content to
  improve its products.

## Security notes

- All database access goes through Supabase row-level security. A person who creates an
  account sees nothing; only emails on the allowlist become admins.
- A database trigger enforces seat capacity, name and email checks and field lengths on
  registrations, and always stores `attended` as false.
- Security headers (no framing, no content sniffing, strict referrer policy, HSTS) are set
  in `vite.config.ts` and appear in the Netlify headers file.
- Planned: privacy notice and consent checkbox, Content-Security-Policy, shared rate limiting
  and spam protection on forms.

## Project layout

```
src/routes/            pages and API routes (api/chat.ts, api/health.ts)
src/components/site/   header, footer and page layout
src/hooks/use-auth.ts  who is signed in
src/lib/               shared content and helpers (eswa-content.ts)
src/integrations/supabase/   Supabase clients
supabase/migrations/   database setup, run in the SQL Editor
public/                robots.txt, sitemap.xml, images
```

`src/routeTree.gen.ts` is generated automatically when you run `npm run dev`.

## Contributing

- Work on a branch and open a pull request. Do not commit `.env` or any key.
- Run `npm run typecheck` before pushing.
- If a key is ever pasted into chat, a screenshot or a commit, replace it.

## Before launch checklist

- [ ] Sign-ups switched off in Supabase, and only real staff on the allowlist
- [ ] Production Supabase project on Pro, separate from the test project
- [ ] Gemini billing on, with a budget alert
- [ ] Own domain, email sending set up, Redirect URLs updated
- [ ] Privacy notice and consent on forms
- [ ] Placeholder contact details, `public/sitemap.xml` and `public/robots.txt` updated
- [ ] `/api/health` monitored (for example with UptimeRobot)

## Contact

See the contact details in the site footer.
