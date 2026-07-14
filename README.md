# Empyr Portfolio

Personal portfolio site at [empyr-portfolio.com](https://empyr-portfolio.com) — showcasing web apps and sellable business website templates built with Astro.

## What's included

- **Featured project:** [Risale-i Nur Reader](/risale/nl) — trilingual (TR/NL/EN) reading platform
- **Business templates:** restaurants, cafés, barbershops, and more (NL + EN demos)

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:4321](http://localhost:4321) — redirects to `/nl` (Dutch portfolio home).

Build portfolio + Risale-i Nur subpath:

```bash
npm run build:all
```

## Deployment

Hosted on **GitHub Pages** with custom domain `empyr-portfolio.com`. See [DEPLOY.md](./DEPLOY.md) for setup steps (GitHub repos, DNS, Pages settings).

## Templates

| Template | Best for | Demo route (NL) | Demo route (EN) |
|----------|----------|------------------|------------------|
| **Trattoria** | Italian, Greek, family dining | `/nl/trattoria` | `/en/trattoria` |
| **Noir** | Fine dining, steakhouse, wine bar | `/nl/noir` | `/en/noir` |
| **Corner** | Café, brunch, fast-casual | `/nl/corner` | `/en/corner` |
| **Ocakbasi** | Turkish grill, kebab, halal takeout | `/nl/ocakbasi` | `/en/ocakbasi` |

The `Ocakbasi` template is modeled on a real Turkish ocakbasi/grill restaurant (Reis Ocakbasi & Etli Ekmek, Schiedam) — real address, phone, hours, and menu structure, used here as demo content.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:4321](http://localhost:4321) — it redirects to `/nl` (the portfolio landing page, Dutch by default).

## Internationalization

- Default language: **Dutch (`nl`)**. English (`en`) is fully supported and switchable via the NL/EN toggle in the nav on every page.
- Routes are language-prefixed: `/nl/<slug>` and `/en/<slug>`, statically generated for both languages (SEO-friendly, with `hreflang` alternate tags).
- UI chrome strings (nav labels, buttons, section headings, legal text) live in `src/i18n/ui.ts`.
- Per-restaurant content (menu, tagline, description, about text, testimonials, opening hours) is bilingual per config, under `content: { nl: {...}, en: {...} }` in `src/types/site-config.ts`.
- To add a language: add it to `languages` in `src/i18n/ui.ts`, add its UI strings, and add a matching `content.<lang>` block to each config in `src/data/`.

## Per-client workflow

1. Copy a template config from `src/data/` (e.g. `trattoria-config.ts`)
2. Update the non-localized fields (name, address, phone, images, theme colors) and both `content.nl` / `content.en` blocks
3. Register it in `src/data/configs.ts`
4. Deploy to Netlify or Vercel (free tier)
5. Point the client's domain via DNS

## Deployment

### Netlify (recommended)

1. Push this repo to GitHub
2. Connect at [netlify.com](https://netlify.com) → New site from Git
3. Build command: `npm run build`, publish directory: `dist`
4. Update `site` in `astro.config.mjs` and `public/robots.txt` with your Netlify URL

### Vercel

1. Push to GitHub
2. Import at [vercel.com](https://vercel.com) — auto-detects Astro via `vercel.json`
3. Update `site` in `astro.config.mjs` with your Vercel URL

## Suggested pricing (EU)

| | Setup | Monthly |
|---|-------|---------|
| Starter | €750 – €950 | €50 – €70 |
| Standard | €950 – €1,200 | €70 – €90 |
| Upsells | +€150 – €500 | — |

## Features

- Mobile-first responsive design
- Bilingual (NL default / EN) with static per-language routes
- Explicit contrast-safe theme colors (`onPrimaryText`, `onAccentText`) — no dark-on-dark text bugs
- Schema.org Restaurant structured data (halal, ratings, opening hours) + Open Graph / Twitter meta
- Sitemap generation
- Impressum + Privacy Policy per language (GDPR-friendly, no tracking cookies)
- Free static hosting

## Project structure

```
src/
  components/shared/   # Reusable sections (nav, hero, menu, gallery, footer, etc.)
  components/corner/   # Daily special + Instagram feed (used by Corner & Ocakbasi)
  data/                # Template configs, one per client, plus configs.ts registry
  i18n/                # UI string dictionary (ui.ts) + lang helpers (utils.ts)
  layouts/             # BaseLayout with theme CSS variables
  pages/[lang]/[slug]/ # Dynamic per-language, per-template routes
  types/                # TypeScript SiteConfig / LocalizedContent interfaces
  utils/hours.ts        # Opening-hours formatting + schema.org day mapping
```
