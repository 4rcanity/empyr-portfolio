# HI/LO FRENZY — realtime server

Cloudflare Worker + Durable Object that runs one authoritative game table per room code.
No third-party realtime framework: raw `WebSocketPair` in a Durable Object.

## Endpoints

| Path | Purpose |
|------|---------|
| `GET /health` | liveness probe |
| `WS /room/{code}/socket` | join a table |

## Local dev

```bash
cd server/hilo
npm install
npx wrangler dev        # http://localhost:8787
```

Portfolio root `.env`:

```
PUBLIC_HILO_HOST=localhost:8787
```

Then `npm run dev` in the repo root and open `/nl/minigames/frenzy`.

## Deploy

```bash
cd server/hilo
npx wrangler deploy
```

Production host is baked into the client as a fallback:
`empyr-hilo.arcanearthenden.workers.dev`

## Test scripts

```bash
# Three bots play a whole round and assert cards + vote + a winner
node scripts/smoke.mjs [host]

# Fill a real room with practice bots so you can play solo
node scripts/bots.mjs <roomCode> [count] [host]
```

## State model

Room state lives in Durable Object memory while sockets are open. Seats are keyed by a
client-generated player id (kept in `sessionStorage`), so refreshes and flaky networks
rejoin the same seat instead of creating a new one. Abandoned lobby seats are swept by an
alarm after 60s. Turn clocks also use the DO alarm.
