# Deploying Empyr (empyr-portfolio.com)

Empyr is a **Next.js** app (API routes + Clerk middleware). It must run on a
Node host — **Vercel** is the supported target. GitHub Pages cannot host this
stack.

Live app repo: https://github.com/4rcanity/empyr-portfolio

## 1. Connect the repo to Vercel

1. Open [vercel.com/new](https://vercel.com/new)
2. Import **`4rcanity/empyr-portfolio`**
3. Framework preset: **Next.js** (auto-detected)
4. Root directory: `.` (repo root)
5. Do **not** deploy yet — add env vars first (step 2)

Or from this folder after `npx vercel login`:

```bash
npx vercel link
npx vercel env pull .env.local   # optional
npx vercel --prod
```

## 2. Environment variables (Vercel project → Settings → Environment Variables)

Copy from [`.env.example`](./.env.example). Set for **Production** (and Preview if you want):

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk → API Keys |
| `CLERK_SECRET_KEY` | Yes | Clerk → API Keys |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Yes | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Yes | `/sign-up` |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional* | Needed to persist generated sites |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional* | |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional* | Server-only; never expose to client |
| `LLM_PROVIDER` | No | Default `placeholder` |
| `LLM_API_KEY` | No | Empty = placeholder mode |
| `LLM_MODEL` | No | e.g. `claude-sonnet-5` |

\*Without Supabase, `/api/generate` still returns layout JSON; it just skips DB writes.

### Clerk production setup

1. [dashboard.clerk.com](https://dashboard.clerk.com) → your Empyr app
2. **Domains** → add `empyr-portfolio.com` (and `www` if used)
3. **Paths**: sign-in `/sign-in`, sign-up `/sign-up`, after-auth `/dashboard`
4. Copy publishable + secret keys into Vercel

### Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. SQL Editor → run [`supabase/migrations/001_init.sql`](./supabase/migrations/001_init.sql)
3. Project Settings → API → copy URL, anon key, service role key into Vercel

## 3. Deploy

In Vercel: **Deploy**. Or:

```bash
npx vercel --prod
```

Confirm the deployment URL works (`https://*.vercel.app`), then attach the custom domain.

## 4. Custom domain `empyr-portfolio.com`

1. Vercel project → **Settings → Domains** → add `empyr-portfolio.com`
2. Add `www.empyr-portfolio.com` and redirect to apex (recommended)
3. At your DNS registrar, use the records Vercel shows (typically):

| Type | Name | Value |
|------|------|--------|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

Exact values are always whatever Vercel displays for your project — prefer those over this table if they differ.

4. Wait for DNS + SSL (often minutes, up to 48h)
5. In Clerk, ensure the production domain matches

### Migrating off GitHub Pages

If the domain still points at GitHub Pages IPs (`185.199.108–111.153`), replace those A records with Vercel’s. Remove the old GitHub Pages custom-domain setting so it stops claiming the domain.

The old `public/CNAME` file was for GitHub Pages and is no longer used for Vercel routing.

## 5. Smoke test after go-live

| Check | URL / action |
|-------|----------------|
| Marketing | `https://empyr-portfolio.com/` |
| Sign-in | `/sign-in` → Clerk UI |
| Dashboard | `/dashboard` (auth required) |
| Generate | Submit a prompt → preview renders hero / features / footer |

## 6. Local development

```bash
npm install
cp .env.example .env.local
# fill Clerk keys (Supabase optional)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Troubleshooting

- **Build fails on Clerk keys**: set real `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` in Vercel (invalid placeholders fail at runtime).
- **Middleware loops / 404 on sign-in**: confirm Clerk path env vars and Clerk dashboard URLs.
- **Generate works but nothing saves**: Supabase env missing or migration not applied — expected in placeholder-only mode.
- **Old `/nl` portfolio URLs 404**: the Astro demos were archived; SaaS routes are `/`, `/dashboard`, `/sign-in`, `/sign-up`.
