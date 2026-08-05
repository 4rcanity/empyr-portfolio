# EMPYR UNO — realtime worker

Cloudflare Worker + Durable Object backing the UNO table at
`/{lang}/minigames/uno`. One Durable Object instance per room code, addressed
by `idFromName(code)`, so every player in a room shares one authoritative game.

## Endpoints

| Route | Purpose |
| --- | --- |
| `GET /` or `/health` | JSON health probe |
| `GET /room/:code/socket` | WebSocket upgrade into that room |

## Local development

```bash
npm run dev          # wrangler dev on port 8788
```

Point the site at it with `PUBLIC_UNO_HOST=localhost:8788` in `.env`, or just
run the Astro dev server — the client falls back to `localhost:8788` in dev.

## Deploy

```bash
npm run deploy       # or: npm run uno:deploy from the repo root
```

## Test scripts

### `scripts/smoke.mjs`

Headless four-bot run that plays a complete game with **every deck pack** —
classic, Flip, No Mercy, All Wild, Attack — plus a House Rules run and a
multi-round scored run. The bots mirror the server's legality rules locally, so
if the server ever rejects a move the bots believed was legal, the run fails
loudly instead of quietly desyncing.

```bash
node scripts/smoke.mjs                 # against localhost:8788
node scripts/smoke.mjs empyr-uno.<subdomain>.workers.dev
```

Exits `0` on success and prints the winner and observed effects per pack.

### `scripts/idle.mjs` and `scripts/afk.mjs`

Regression guards for the turn clock. An in-progress room used to re-arm its
alarm on a loop forever once abandoned, which kept the Durable Object alive
indefinitely.

```bash
node scripts/idle.mjs   # everyone disconnects — the clock must park
node scripts/afk.mjs    # everyone stays but stops moving — the round must be dropped (~2.5 min)
```

### `scripts/bots.mjs`

Fills a real room with practice bots so a single human can test the UI.

```bash
node scripts/bots.mjs <roomCode> [count] [host]
```

They ready up, play at human pace, occasionally forget to call UNO (so you can
catch them), and will only deal the cards themselves if no human took the host
seat.

## Game rules implemented

Base game plus five DLC packs selectable in the lobby:

| Pack | What it changes |
| --- | --- |
| **Flip** | Double-sided deck. Flip cards swap the whole table between the mild light side (Draw One, Skip) and the brutal dark side (Draw Five, Skip Everyone, Wild Draw Colour). |
| **No Mercy** | Draw Sixes, Wild Draw Tens, Skip Everyone, Discard All. Stacking is forced on and 25 cards in hand knocks you out — last player standing wins. |
| **All Wild** | No numbers and no colour matching. Every card is an action. |
| **Attack** | Classic deck plus Hit Fire cards that spray an unpredictable 0–12 card blast. |
| **House Rules** | Toggle pack: 7-0 (swap/rotate hands), Jump-In, stacking, and draw-until-playable. |

Also handled: UNO calls and catching (2-card penalty), draw-stack accumulation,
reverse-as-skip in heads-up play, deck recycling from the discard pile, per-round
scoring to a target, dealer rotation, reconnect-safe seats, host stability, and
an alarm-backed turn clock that auto-plays so a disconnected player can never
stall the table.
