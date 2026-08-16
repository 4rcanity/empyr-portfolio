# Empyr help widget — mail pipe

Tiny Cloudflare Worker. No Durable Objects. Accepts a POST from the portfolio
help widget and emails a transcript to `business@empyr-portfolio.com` via
[Web3Forms](https://web3forms.com) (free tier).

The GitHub Pages site is static. **Pages deploy alone does not send mail.**
This worker has to be deployed, and `WEB3FORMS_ACCESS_KEY` has to be set,
before live handoff works.

## Endpoints

| Path | Purpose |
|------|---------|
| `GET /health` | liveness probe |
| `POST /handoff` | `{ email, lang, messages, summary?, page? }` → Web3Forms |

CORS allows `https://empyr-portfolio.com` and `localhost` / `127.0.0.1`.

If the secret is missing the worker returns **503** so the widget can tell
people to mail `business@` themselves.

## Local dev

```bash
cd server/help
npm install
cp .dev.vars.example .dev.vars   # paste a Web3Forms access key
npx wrangler dev --port 8790     # http://localhost:8790
```

Portfolio root `.env`:

```
PUBLIC_HELP_HOST=localhost:8790
```

Then `npm run dev` in the repo root. The widget reads `PUBLIC_HELP_HOST`
(no protocol), same pattern as the minigame hosts.

From the repo root:

```bash
npm run help:dev
```

## Deploy

```bash
cd server/help
npx wrangler secret put WEB3FORMS_ACCESS_KEY
npx wrangler deploy
```

Or from the repo root: `npm run help:deploy` (still set the secret first).

Production host (no protocol), same naming as the game workers:

```
PUBLIC_HELP_HOST=empyr-help.arcanearthenden.workers.dev
```

The widget falls back to that host when the env var is unset in production.

## Secrets

| Name | Where | Notes |
|------|--------|--------|
| `WEB3FORMS_ACCESS_KEY` | Worker secret / `.dev.vars` | Never put this in the Astro bundle or a `PUBLIC_*` var. Create a free key at web3forms.com bound to `business@empyr-portfolio.com`. |
| `PUBLIC_HELP_HOST` | Site `.env` | Hostname only. Safe to commit the production workers.dev name in `.env.example`. |
