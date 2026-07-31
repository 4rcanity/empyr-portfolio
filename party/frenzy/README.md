# Higher or Lower: Frenzy — realtime server

PartyServer (Durable Object) that powers private Frenzy rooms for the Empyr portfolio.

## Prerequisites

1. Free [Cloudflare account](https://dash.cloudflare.com/sign-up) (you already have one).
2. Node 22+.

## Local dev

```bash
cd party/frenzy
npm install
npx wrangler login
npm run dev
```

Worker defaults to `http://localhost:8787`.

In the portfolio root, create `.env`:

```
PUBLIC_FRENZY_HOST=localhost:8787
```

Then:

```bash
npm run dev
```

Open `/nl/minigames/frenzy` → create room → share the invite link with 2+ friends (3 players minimum).

## Deploy

```bash
cd party/frenzy
npx wrangler deploy
```

Copy the printed `*.workers.dev` URL (no `https://` needed for PartySocket host, but either works).

Set in portfolio root `.env` (and CI secrets if any):

```
PUBLIC_FRENZY_HOST=empyr-frenzy.<your-subdomain>.workers.dev
```

Rebuild and push the Astro site:

```bash
npm run build
git push
```

## Client connection

- Party binding name: `FrenzyRoom` → PartySocket `party: "frenzy-room"`
- Room URL: `/{lang}/minigames/frenzy/play?room={roomId}`
- Pretty `/room/{id}` links redirect via `public/404.html` on GitHub Pages
