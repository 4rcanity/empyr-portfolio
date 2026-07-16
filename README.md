# Empyr

Empyr is an AI-driven site generation SaaS. A user describes their business
in a prompt and Empyr returns a brand-ready layout (hero, feature grid,
footer) that renders instantly in the dashboard preview.

**SaaS skeleton status:** complete end-to-end — Clerk auth, Supabase schema,
typed `LayoutDocument` contract, placeholder LLM → `/api/generate`, and a
live dashboard playground that renders `HeroBlock` / `FeatureGridBlock` /
`FooterBlock`.

> The previous static Astro portfolio (restaurant/café template demos) has
> been archived, unmodified, at [`_archive/astro-portfolio/`](./_archive/astro-portfolio/)
> for reference. It is not part of the active app.

## Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`)
- **Auth:** Clerk (`@clerk/nextjs`) — middleware-protected `/dashboard` and `/api/generate`
- **Database:** Supabase (Postgres) via `@supabase/supabase-js`
- **Validation:** Zod — shared `LayoutDocument` contract in `src/types/layout.ts`

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in at least Clerk keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Path | Purpose |
|------|---------|
| `/` | Marketing landing |
| `/sign-in` / `/sign-up` | Clerk auth |
| `/dashboard` | Prompt → generate → live preview |

Supabase keys are optional for local preview — generation still returns layout
JSON when persistence env is missing.

## Environment variables

See [`.env.example`](./.env.example) for the full list (Clerk, Supabase,
placeholder LLM adapter config). No secrets are committed.

## Database

The Postgres schema (`users`, `generated_sites`) lives in
[`supabase/migrations/001_init.sql`](./supabase/migrations/001_init.sql).
Apply it via the Supabase SQL editor or the Supabase CLI:

```bash
supabase db push
```

## Project structure

```
src/
  middleware.ts                 # Clerk route protection (/dashboard, /api/generate)
  app/
    layout.tsx                  # root layout: fonts, ClerkProvider, Empyr tokens
    globals.css                 # Tailwind + Empyr CSS variables
    page.tsx                    # marketing landing (Empyr brand)
    sign-in/[[...sign-in]]/     # Clerk sign-in
    sign-up/[[...sign-up]]/     # Clerk sign-up
    dashboard/                  # authenticated shell + generate playground
    api/generate/route.ts       # secure LLM -> layout JSON endpoint
  components/
    blocks/                     # HeroBlock, FeatureGridBlock, FooterBlock, BlockRenderer
    dashboard/                  # PromptForm, SitePreview, DashboardPlayground
  lib/
    supabase/                   # client.ts / server.ts / types.ts
    llm/                        # placeholder LLM adapter
  types/
    layout.ts                   # LayoutDocument Zod schemas + inferred types
supabase/migrations/001_init.sql
_archive/astro-portfolio/       # archived Astro app (reference only)
```

## Scripts

```bash
npm run dev         # local dev server
npm run typecheck   # tsc --noEmit
npm run build       # production build
npm run start       # serve production build
```

## Deployment

GitHub Pages cannot run Next.js API routes or middleware-based auth. Deploy to
**Vercel** (or another Node-capable host). Set the same env vars from
`.env.example` in the host dashboard. DNS cutover for `empyr-portfolio.com`
is intentionally not changed as part of this skeleton.

## Roadmap (post-skeleton)

- Swap placeholder LLM for a real provider (Claude / Fable)
- Clerk ↔ Supabase JWT bridge + RLS policies
- Public site publishing / custom slugs
- Billing / subscriptions
