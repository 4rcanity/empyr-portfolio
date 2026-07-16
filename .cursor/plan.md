# Empyr SaaS Skeleton — Master Plan

**Status:** APPROVED & EXECUTED — Phase 2 complete; Phase 3 typecheck green  
**Domain:** [empyr-portfolio.com](https://empyr-portfolio.com)  
**Objective:** Finish the secure, modular AI-driven site generation platform (SaaS skeleton) on top of the existing Next.js migration.  
**Gate:** No new application code, package installs, or Phase 2 worker runs until this plan is explicitly approved.

**Orchestrator:** Fable 5 / GPT-5.6 Sol (this plan)  
**Workers (Phase 2 only, after approval):** Claude Sonnet 5 subagents A / B / C

---

## 0. Reality check (workspace scan — Jul 2026)

The repo is **already past** a bare Astro portfolio. A prior pass scaffolded Next.js and archived Astro. This plan is rewritten against **current disk state**, not the outdated “still Astro” draft.

| Area | Current state |
|------|----------------|
| Active app | **Next.js 15** App Router + React 19 + TypeScript |
| Styling | Tailwind CSS **v4** via `@tailwindcss/postcss` |
| Auth | `@clerk/nextjs` — `src/middleware.ts` protects `/dashboard(.*)` and `/api/generate(.*)` |
| DB client | `@supabase/supabase-js` — `src/lib/supabase/{client,server,types}.ts` |
| Schema SQL | `supabase/migrations/001_init.sql` (`users`, `generated_sites`) |
| Layout contract | `src/types/layout.ts` — full Zod `LayoutDocument` + Empyr defaults |
| Generate API | **Stub only** — returns `501 Not implemented` |
| UI blocks | **Missing** — no `src/components/blocks/**` |
| LLM adapter | **Missing** — no `src/lib/llm/**` |
| Dashboard playground | Placeholder (“Playground coming soon”) |
| Astro portfolio | Archived at `_archive/astro-portfolio/` (reference only) |
| Hosting note | GH Pages cannot run this stack → target **Vercel**; DNS cutover out of scope |

**Installed deps** (root `package.json` — do not reinstall blindly):

- Production: `next`, `react`, `react-dom`, `@clerk/nextjs`, `@supabase/supabase-js`, `zod`, `tailwindcss`, `@tailwindcss/postcss`
- Dev: `typescript`, `@types/node`, `@types/react`, `@types/react-dom`, `eslint`, `eslint-config-next`
- Scripts: `dev`, `build`, `start`, `lint`, `typecheck` (`tsc --noEmit`)
- Engine: Node `>=22.12.0`

---

## 1. Design & assets to preserve

### Empyr marketing brand (already in Next `globals.css` / layout)

| Token | Value |
|-------|--------|
| Background | `#0c0a09` (`--empyr-bg`) |
| Surface | `#1c1917` (`--empyr-surface`) |
| Accent | `#f97316` (`--empyr-accent`) |
| Text | `#f5f5f4` (`--empyr-text`) |
| Muted | `#a8a29e` (`--empyr-muted`) |
| Font | **Inter** (heading + body) |
| Logo | `/images/empyr-logo.png` |
| Favicon | `/favicon.svg` |
| Contact (archive reference) | WhatsApp `+31638269872`, `business@empyr-portfolio.com` |

### Archived template system (inform block themes — do not port demos)

From `_archive/astro-portfolio/` — per-demo CSS vars and fonts (Trattoria, Noir, Corner, Ocakbasi, Barberhouse, Medrese). Workers may use those palettes as **optional theme inspiration** inside `ThemeTokens`, but must not revive Astro routes or restaurant configs in this skeleton.

### Assets carried at repo root `public/`

```
public/
  favicon.svg
  robots.txt
  CNAME
  images/empyr-logo.png
```

---

## 2. Target file tree (complete SaaS skeleton)

Paths marked ✅ exist; ❌ still to create/finish in Phase 2.

```
.
├── .cursor/
│   └── plan.md                              ✅ (this file)
├── .env.example                             ✅
├── .gitignore                               ✅
├── README.md                                ✅
├── package.json                             ✅
├── package-lock.json                        ✅
├── tsconfig.json                            ✅
├── next.config.ts                           ✅
├── postcss.config.mjs                       ✅
├── next-env.d.ts                            ✅
├── vercel.json                              ✅ (review; do not change DNS)
├── public/                                  ✅ brand assets
├── supabase/migrations/001_init.sql         ✅
├── _archive/astro-portfolio/                ✅ reference only
└── src/
    ├── middleware.ts                        ✅ Clerk protect /dashboard + /api/generate
    ├── css.d.ts                             ✅
    ├── app/
    │   ├── layout.tsx                       ✅
    │   ├── globals.css                      ✅ Empyr tokens
    │   ├── page.tsx                         ✅ marketing landing
    │   ├── sign-in/[[...sign-in]]/page.tsx  ✅
    │   ├── sign-up/[[...sign-up]]/page.tsx  ✅
    │   ├── dashboard/
    │   │   ├── layout.tsx                   ✅ shell
    │   │   └── page.tsx                     ⚠️ shell only — wire playground (C)
    │   └── api/generate/route.ts            ❌ finish (B) — currently 501 stub
    ├── components/
    │   ├── blocks/
    │   │   ├── HeroBlock.tsx                ❌ (C)
    │   │   ├── FeatureGridBlock.tsx         ❌ (C)
    │   │   ├── FooterBlock.tsx              ❌ (C)
    │   │   └── BlockRenderer.tsx            ❌ (C)
    │   └── dashboard/
    │       ├── PromptForm.tsx               ❌ (C)
    │       └── SitePreview.tsx              ❌ (C)
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts                    ✅
    │   │   ├── server.ts                    ✅
    │   │   └── types.ts                     ✅
    │   └── llm/
    │       └── placeholder.ts               ❌ (B)
    └── types/
        └── layout.ts                        ✅ Zod LayoutDocument (do not duplicate)
```

**Note:** Middleware lives at `src/middleware.ts` (Next.js `src/` convention). Do **not** add a second root `middleware.ts`.

---

## 3. npm dependencies

### Already installed — leave as-is unless a worker finds a compile blocker

| Package | Role |
|---------|------|
| `next` | App Router |
| `react` / `react-dom` | UI |
| `@clerk/nextjs` | Auth + middleware |
| `@supabase/supabase-js` | Postgres client |
| `zod` | Request + layout validation |
| `tailwindcss` + `@tailwindcss/postcss` | Styling v4 |

### Optional (only if Phase 2 needs them — check `package.json` first)

| Package | When |
|---------|------|
| Real LLM SDK (e.g. `@anthropic-ai/sdk`) | **Out of scope** for skeleton — use placeholder adapter |
| `supabase` CLI | Local DB push only; not required for app compile |

### Environment (`.env.example` — no secrets in git)

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

LLM_PROVIDER=placeholder
LLM_API_KEY=
LLM_MODEL=claude-sonnet-5
```

**Anti-mismatch rule:** Before any `npm install`, re-read root `package.json`. Prefer existing majors. Do not bump Next/React/Clerk casually.

---

## 4. Database schema (exact)

Source of truth: `supabase/migrations/001_init.sql` (already written). Workers must not invent alternate tables.

### `users`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK, `DEFAULT gen_random_uuid()` |
| `clerk_id` | `text` | `NOT NULL`, `UNIQUE` |
| `email` | `text` | `NOT NULL` |
| `display_name` | `text` | nullable |
| `created_at` | `timestamptz` | `NOT NULL`, `DEFAULT now()` |
| `updated_at` | `timestamptz` | `NOT NULL`, `DEFAULT now()` |

### `generated_sites`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK, `DEFAULT gen_random_uuid()` |
| `user_id` | `uuid` | `NOT NULL`, `REFERENCES users(id) ON DELETE CASCADE` |
| `name` | `text` | `NOT NULL` |
| `prompt` | `text` | `NOT NULL` |
| `layout_json` | `jsonb` | `NOT NULL` |
| `status` | `text` | `NOT NULL`, `DEFAULT 'draft'`, `CHECK (status IN ('draft','published','archived'))` |
| `slug` | `text` | nullable; unique per user when set |
| `created_at` | `timestamptz` | `NOT NULL`, `DEFAULT now()` |
| `updated_at` | `timestamptz` | `NOT NULL`, `DEFAULT now()` |

### Indexes (already in migration)

- `generated_sites_user_slug_uidx` — unique `(user_id, slug)` where `slug IS NOT NULL`
- `generated_sites_user_id_idx`
- `generated_sites_layout_gin` — GIN on `layout_json`

### Access model (skeleton)

- RLS **enabled** on both tables; no Clerk↔Supabase JWT policies yet.
- Server routes: verify Clerk `auth()` first, then use `SUPABASE_SERVICE_ROLE_KEY` when persisting.
- If Supabase env is missing, generate API must still return valid layout JSON (no hard fail).

TS row types live in `src/lib/supabase/types.ts` and must stay aligned with SQL.

---

## 5. Layout JSON contract (shared — already implemented)

**Single source of truth:** `src/types/layout.ts`  
Subagents B and C **import only** from here — never redefine.

```ts
// Conceptual summary (full Zod already in repo)

type BlockType = 'hero' | 'featureGrid' | 'footer';

interface ThemeTokens {
  background: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  onAccentText: string;
  fontHeading: string;
  fontBody: string;
}

interface LayoutDocument {
  version: 1;
  meta: { siteName: string; description?: string };
  theme: ThemeTokens;
  blocks: Array<HeroBlockData | FeatureGridBlockData | FooterBlockData>;
}
```

Defaults: `defaultEmpyrTheme` (dark stone + orange + Inter).

---

## 6. Phase 2 handoff — Claude Sonnet 5 subagents

### Global anti-phasing rules

1. Always write **complete files** — no `// ... rest of code`, no truncated imports/methods.
2. Every export must match its imports across files.
3. Re-read `package.json` before any install; avoid version mismatches.
4. **No code until this plan is approved.**
5. Prefer Empyr brand tokens for marketing + default block themes.
6. Do not edit `_archive/astro-portfolio/` except to read reference.

### Execution order

```
Subagent A (Infra polish)  →  Subagent B (API + LLM)  →  Subagent C (Blocks + playground)
```

A is mostly done; it only closes remaining infra gaps. B and C do the bulk of remaining work.

---

### Subagent A — Infrastructure & Auth (gap-close only)

**Model:** Claude Sonnet 5  

**Owns (only if still incomplete after scan):**

1. Confirm Clerk middleware at `src/middleware.ts` protects `/dashboard(.*)` and `/api/generate(.*)` — already present; fix only if broken.
2. Confirm `.env.example`, supabase clients/types, and `001_init.sql` match §4 — already present.
3. Confirm root scripts `typecheck` / `build` are runnable.
4. **Do not** re-scaffold Next, re-archive Astro, or reinstall packages unless compile is broken.
5. **Do not** implement LLM logic or UI blocks.

**Acceptance:**

- Protected routes remain correct
- `npm run typecheck` passes on current tree (before B/C add files)
- No duplicate middleware / layout schemas

---

### Subagent B — API Handler

**Model:** Claude Sonnet 5  

**Owns:**

1. Replace stub `src/app/api/generate/route.ts` with a **complete** `POST` handler:
   - Clerk `auth()` → `401` if no `userId`
   - Body Zod: `{ prompt: string (min 1, max 4000), siteName?: string }`
   - Call `src/lib/llm/placeholder.ts`
   - Validate output with `layoutDocumentSchema`
   - Return `{ layout: LayoutDocument }`
   - Invalid model JSON → `502` safe message (no stack leaks)
2. Complete `src/lib/llm/placeholder.ts`:
   - If `LLM_PROVIDER=placeholder` or no `LLM_API_KEY`, return a **deterministic** valid `LayoutDocument` derived from the prompt (no network)
   - Shape the adapter so a real Claude Sonnet 5 / Fable 5 HTTP call can replace the body later (`generateLayout(prompt, opts)`)
3. Optional persist to `generated_sites` when Supabase service env is set (upsert `users` by `clerk_id`); if env missing, still return layout.

**Acceptance:**

- Placeholder mode always returns schema-valid JSON
- Middleware + in-handler auth both enforced
- Imports only `layout.ts` for document types

---

### Subagent C — Component Playground

**Model:** Claude Sonnet 5  

**Owns:**

1. Complete self-contained blocks (full files):
   - `HeroBlock.tsx` — brand-first / full-bleed capable; props = `HeroBlockData` + `theme`
   - `FeatureGridBlock.tsx` — props = `FeatureGridBlockData` + `theme`
   - `FooterBlock.tsx` — props = `FooterBlockData` + `theme`
2. `BlockRenderer.tsx` — exhaustive `switch` on `block.type`
3. Dashboard wiring:
   - `PromptForm.tsx` → `POST /api/generate`
   - `SitePreview.tsx` → `BlockRenderer`
   - Update `src/app/dashboard/page.tsx` to compose form + preview (complete file)
4. Visual rules: Empyr dark stone / orange defaults; CSS variables from `theme`; no purple-on-white clichés; no cards in hero; no incomplete stubs.

**Acceptance:**

- Authenticated dashboard: prompt → JSON → all three block types render
- All props typed from `src/types/layout.ts` only

---

## 7. Phase 3 — Quality control (Orchestrator)

After A/B/C:

1. `npm run typecheck` (and `npm run build` if env allows).
2. Grep for phasing smells: `rest of`, `TODO: implement`, `Not implemented`, broken imports.
3. Verify export/import graph: `layout.ts` ↔ blocks ↔ `BlockRenderer` ↔ `route.ts` ↔ `placeholder.ts` ↔ supabase clients ↔ middleware.
4. Present final diff for human approval before merge/deploy.

---

## 8. Out of scope

- Porting Astro restaurant / Medrese / games demos to Next
- Real production LLM billing, rate limits, quotas
- Clerk ↔ Supabase JWT third-party auth bridge (document only)
- DNS cutover off GitHub Pages
- Stripe / subscriptions
- Multi-tenant custom domains for generated sites

---

## 9. Approval checklist

Reply with approval (optionally with edits) on:

- [x] Accept **current Next.js + archive** baseline (no full re-scaffold)
- [x] Dependency list (§3) — install only if compile requires
- [x] Schema `users` + `generated_sites` (§4)
- [x] Layout JSON contract in `src/types/layout.ts` (§5)
- [x] Sonnet 5 handoff A (gap-close) → B (API) → C (blocks) (§6)
- [x] Empyr brand tokens as defaults for marketing + blocks

**Approved and executed.** Phase 2 + Phase 3 complete (`npm run typecheck` / `npm run build` green).
