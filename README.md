# ESWA Wellbeing Hub

The ESWA (Educator Support and Wellness Alliance) Wellbeing Hub is a TanStack Start
application for educator wellbeing programmes: workshop listings and registration, a staff
dashboard with attendance tracking and Excel exports, a feedback questionnaire, mental health
resources, and an AI wellness assistant.

Stack: **TanStack Start + React 19 + Vite + Nitro** (frontend/SSR) ·
**Supabase** (database, auth, RLS) · **Google Gemini** (server-side chat, optional) ·
hosted on **Netlify** for team testing.

> **Project status:** this is a pre-release build being reviewed by the team. A security
> hardening pass is planned *after* the review, so please use **fake data only** when testing
> registrations and feedback.

## Contents

1. [Run it locally (macOS / Linux / Windows)](#1-run-it-locally)
2. [Environment variables](#2-environment-variables)
3. [What to test](#3-what-to-test)
4. [Supabase setup (one-time, project owner)](#4-supabase-setup-one-time-project-owner)
5. [Deploy to Netlify](#5-deploy-to-netlify)
6. [Other deployment options](#6-other-deployment-options)
7. [Troubleshooting](#7-troubleshooting)
8. [Notes](#8-notes)

---

## 1. Run it locally

### 1.1 Prerequisites

- **Node.js 22 or newer** (see `.nvmrc`) — this also installs `npm`
- **Git**
- A `.env` file with the Supabase values (ask the project owner, see [section 2](#2-environment-variables))

Check what you have:

```bash
node -v    # must print v22.x or higher
git --version
```

### 1.2 Install Node.js 22+

<details>
<summary><strong>macOS</strong></summary>

With [Homebrew](https://brew.sh):

```bash
brew install nvm
mkdir -p ~/.nvm
# add the lines Homebrew prints to ~/.zshrc, then open a new terminal
nvm install 22
```

Or download the installer from [nodejs.org](https://nodejs.org).

</details>

<details>
<summary><strong>Linux</strong> (Ubuntu, Debian, Fedora, Arch, …)</summary>

Use [nvm](https://github.com/nvm-sh/nvm) so you are not tied to your distro's old Node:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# open a new terminal, then:
nvm install 22
```

</details>

<details>
<summary><strong>Windows</strong> (PowerShell)</summary>

```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
```

Close and reopen PowerShell afterwards. If you want to switch Node versions easily, use
[nvm-windows](https://github.com/coreybutler/nvm-windows) (`nvm install 22`, `nvm use 22`).
Everything below works in PowerShell, Command Prompt and Git Bash. Only the "copy the env
file" step differs, and it is shown for each shell.

</details>

### 1.3 Get the code, configure, and start

The repository is private, so you must be invited and signed in to GitHub (HTTPS with a
[personal access token](https://github.com/settings/tokens) or SSH, whichever you already use).

**macOS / Linux**

```bash
git clone <REPO_URL> eswa-wellbeing-hub
cd eswa-wellbeing-hub
npm install
cp .env.example .env     # then open .env and fill in the values
npm run dev
```

**Windows (PowerShell)**

```powershell
git clone <REPO_URL> eswa-wellbeing-hub
cd eswa-wellbeing-hub
npm install
Copy-Item .env.example .env     # then open .env and fill in the values
npm run dev
```

**Windows (Command Prompt)**

```bat
git clone <REPO_URL> eswa-wellbeing-hub
cd eswa-wellbeing-hub
npm install
copy .env.example .env
npm run dev
```

Open <http://localhost:3000>. The dev server reloads on save and reads `.env` automatically.
Restart it after changing `.env`.

### 1.4 Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload on port 3000 |
| `npm run build` | Production build into `.output/` |
| `node --env-file=.env .output/server/index.mjs` | Serve the production build locally with your `.env` (same on every OS) |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint (see [Notes](#8-notes)) |
| `npm run format` | Prettier |

> `npm start` runs the production build but does **not** load `.env`. Use the
> `node --env-file=.env …` command above, or export the variables in your shell first.

---

## 2. Environment variables

Copy [`.env.example`](.env.example) to `.env`. The `.env` file is git-ignored; never commit it.

| Variable | Scope | Required | Purpose |
| --- | --- | --- | --- |
| `SUPABASE_URL` | server | yes | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | server | yes | Supabase publishable key |
| `VITE_SUPABASE_URL` | browser | yes | Same project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | browser | yes | Publishable key **only** |
| `VITE_SUPABASE_PROJECT_ID` | browser | yes | Project reference ID |
| `GEMINI_API_KEY` | server | no | Powers `/api/chat`. Without it the chat answers "AI is not configured". |
| `GEMINI_MODEL` | server | no | Defaults to `gemini-3.1-flash-lite` |
| `CHAT_DAILY_CAP` | server | no | Max chat requests per day, all users (default 400) |
| `VITE_PUBLIC_APP_URL` | browser | no | Public origin, used by the `/presentation` page |
| `NITRO_PRESET` | build | no | Deploy target. `node-server` by default; set to `netlify` by `netlify.toml` |
| `PORT` | runtime | no | HTTP port for the production server (default 3000) |

**Getting values as a teammate**

- **Supabase URL and publishable key:** ask the project owner. Everyone testing shares one
  Supabase project, so registrations and feedback you submit are visible to the whole team.
- **Gemini key:** don't share one key around. Create your own free key at
  <https://aistudio.google.com/apikey>, or leave it blank and skip the chat page.
- **Never** put a Supabase `service_role` / secret key in a `VITE_*` variable. The app does
  not currently need the service-role key at all, so don't add it.

---

## 3. What to test

| Page | URL | What to check |
| --- | --- | --- |
| Home | `/` | Loads, upcoming workshops show, links work |
| About | `/about` | Content renders |
| Workshops | `/workshops` | List loads with seat counts |
| Workshop detail | `/workshops/:id` | Register with a **fake** name/email; duplicate email is rejected; a full workshop refuses |
| Calendar | `/calendar` | Month navigation works, workshops appear on the right dates |
| Resources | `/resources` | Content and helpline numbers render |
| Feedback | `/feedback` | Submit the questionnaire (fake data) |
| Wellness chat | `/chat` | Replies stream in; off-topic questions are declined; crisis wording returns the helpline message |
| Staff dashboard | `/staff` | Staff sign-in, registrations, attendance toggle, Excel export (needs an admin account from the project owner) |
| Password reset | `/reset-password` | Reset email link returns to the site |
| Presentation | `/presentation` | Slides navigate |
| Health check | `/api/health` | Returns `{"status":"ok",...}` |

Also try it on a phone-sized screen and report anything that looks broken or confusing.
Please open a GitHub issue per problem with the URL, what you did, and a screenshot.

---

## 4. Supabase setup (one-time, project owner)

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine).
2. Open the **SQL Editor** and run, in order:
   [`supabase/migrations/0000_eswa_core_schema.sql`](supabase/migrations/0000_eswa_core_schema.sql)
   then
   [`supabase/migrations/0001_registration_rules.sql`](supabase/migrations/0001_registration_rules.sql).
   These create the tables, RLS policies, helper functions, registration rules and seed workshops.
3. **Authentication → Providers**: enable **Email**.
4. **Authentication → URL Configuration**: set the **Site URL** to the deployed URL and add
   `http://localhost:3000` and `<your-site>/reset-password` to the **Redirect URLs**.
5. **Admin access:** anyone whose email is in `public.staff_allowlist` becomes an admin when
   their account is created. The migration seeds one address; change it to the real administrator:

   ```sql
   UPDATE public.staff_allowlist SET email = 'admin@your-npo.org.za'
   WHERE email = 'nkhumelenindae777@gmail.com';
   ```

   Create staff accounts yourself under **Authentication → Users** (the app has no public
   sign-up form).
6. Copy the project URL and publishable key into `.env` / Netlify (section 2).

---

## 5. Deploy to Netlify

[`netlify.toml`](netlify.toml) already contains the build command, publish directory, Node
version and the Nitro preset, so there is nothing to configure in the build settings.

### 5.1 From GitHub (recommended: auto-deploys on every push)

1. Push the repo to GitHub (private is fine; Netlify can read private repos).
2. In Netlify: **Add new site → Import an existing project → GitHub** and pick the repo.
   Leave the build settings as detected from `netlify.toml`.
3. Before deploying, open **Site configuration → Environment variables** and add every
   variable from the table in section 2 that you need:
   `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`, `GEMINI_API_KEY`,
   `GEMINI_MODEL`. Tick **Contains secret values** for `GEMINI_API_KEY`.
   Do **not** add a service-role key.
4. Click **Deploy**. When it finishes you get a URL like `https://something.netlify.app`.
5. Set `VITE_PUBLIC_APP_URL` to that URL and **Deploys → Trigger deploy → Clear cache and
   deploy site** (it is baked in at build time).
6. Add the URL to Supabase (section 4, step 4) so password-reset links come back to the site.
7. Run through [section 3](#3-what-to-test) on the live URL, starting with `/api/health`.

### 5.2 From the command line

```bash
npm install -g netlify-cli
netlify login
netlify init                 # create/link the site
netlify env:import .env      # upload your local .env as Netlify env vars
netlify deploy --build --prod
```

### 5.3 Good to know

- The `VITE_*` variables are compiled into the browser bundle at **build** time, so changing
  them needs a redeploy. Server variables (`GEMINI_API_KEY`, …) are read at runtime.
- The chat rate limit and daily cap are held in memory, so on Netlify each server instance
  counts separately. Set a quota/budget alert on your Gemini key.
- The deployed link is public to anyone who has it. Share it only with the team for now.
- `public/robots.txt` and `public/sitemap.xml` still point at `www.eswa.org.za`; update them
  when the real domain is attached.

---

## 6. Other deployment options

### Docker / VPS

```bash
docker build -t eswa-wellbeing-hub .
docker run -d -p 3000:3000 --env-file .env --name eswa eswa-wellbeing-hub
```

The image runs as a non-root user, exposes port 3000 and has a health check against
`/api/health`. Put Caddy or nginx in front for TLS.

> **Known gap (not yet verified end to end):** the `VITE_*` variables are compiled into the
> browser bundle at build time, but the Dockerfile does not pass them in (and `.dockerignore`
> excludes `.env`). Until `ARG`/`ENV` lines are added to its build stage, the browser bundle
> will not have the Supabase config. Use Netlify for team testing.

### Vercel / Cloudflare / other Nitro presets

Set `NITRO_PRESET` (`vercel`, `cloudflare-module`, …) and follow that platform's
[Nitro guide](https://nitro.build/deploy). A `vercel.json` is included.

---

## 7. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `npm install` errors or `Unsupported engine` | Your Node is older than 22. Run `node -v`, then install Node 22+ (section 1.2). |
| Page shows an error / "Missing Supabase environment variable(s)" | `.env` is missing or incomplete. Check the five Supabase variables, then restart `npm run dev`. |
| Chat says "AI is not configured" | `GEMINI_API_KEY` is empty. Add it and restart the server. |
| Chat says it has reached its daily limit | The `CHAT_DAILY_CAP` or your Gemini free quota is used up. Try tomorrow or raise the cap. |
| Port 3000 already in use | `npm run dev -- --port 3001` (also add it to the Supabase redirect URLs if you use password reset). |
| `npm start` ignores `.env` | Use `node --env-file=.env .output/server/index.mjs`. |
| Netlify build fails with "Secrets scanning found secrets" | A public value isn't in `SECRETS_SCAN_OMIT_KEYS` in `netlify.toml`. Add that variable name to the list. A genuinely secret value in the bundle means a `VITE_` variable holds a secret. Remove it. |
| Netlify site loads but chat or data is empty | An environment variable is missing in Netlify. Add it and redeploy. |
| Windows: lint complains about line endings | Fresh clones use LF (see `.gitattributes`). If you cloned before that file existed, delete the folder and clone again. |

---

## 8. Notes

- **Security:** database access is protected by Supabase RLS, security headers are set in
  `vite.config.ts`, the chat endpoint is rate-limited (12 requests/minute/IP, 400/day overall),
  size-capped, and returns a fixed helpline reply for crisis wording without calling the model.
  A dedicated security review and patching pass is scheduled after the team's functional review.
- **Lint:** `npm run lint` currently reports Prettier formatting differences in existing files
  (no logic errors). `npm run typecheck` passes. Run `npm run format` before committing
  your own changes.
- The Excel export on the staff dashboard uses SpreadsheetML (opens natively in
  Excel/LibreOffice), so the app has no `xlsx` dependency.
- `sourcemap: "hidden"` is enabled. Upload source maps to an error tracker if you add one.
- Routes follow TanStack Start file-based routing; see [`src/routes/README.md`](src/routes/README.md).
