# EMPYR LEDGER — worker

Server-authoritative Cloudflare Worker for the browser board game at
`/{lang}/minigames/monopoly`. One Durable Object (`MonopolyRoom`) per room code
holds the whole game: seats, deeds, buildings, auctions, trades and the turn clock.

## Run it locally

```
npm install
npm run dev          # wrangler dev on port 8789
```

The client picks the host up from `PUBLIC_MONOPOLY_HOST`, falling back to
`localhost:8789` in dev. Port 8789 keeps it clear of the other minigame workers.

## Endpoints

| Route                  | What it does                          |
| ---------------------- | ------------------------------------- |
| `GET /` `GET /health`  | JSON heartbeat                        |
| `/room/:code/socket`   | WebSocket upgrade into the room's DO   |

## Harnesses

```
node scripts/smoke.mjs [host]                 # full assert-everything game, exits 0/1
node scripts/bots.mjs <roomCode> [n] [host]   # practice bots to play against solo
node scripts/afk.mjs [host]                   # ~3 min: idle table must close its books
```

`smoke.mjs` runs three bots through a complete game and fails loudly unless it
observes a purchase, a rent payment, an auction with a winner, a house built on a
completed colour group, an accepted trade, a jail stint and a single survivor.

`afk.mjs` guards the idle path. The turn clock drives play forward when someone
stalls, so a table everybody walks away from must not auto-play itself to a
winner: after eight clock-resolved turns the room closes the books and drops
back to the lobby, and the clock parks entirely once nobody is connected.

## Checks

```
npx tsc --noEmit -p tsconfig.json
npx wrangler types      # regenerate worker-configuration.d.ts after config changes
```

## Rules notes

* Original street names — the layout follows the classic 40-square structure
  (2/3/3/3/3/3/3/2 colour groups, four terminals, two works, two taxes) but every
  name, deck and price label is this project's own.
* Host-configurable: starting cash, salary, double rent on unimproved sets,
  vacation cash pot, auctions, even build, no rent while jailed, mortgage
  interest, turn clock, and house/hotel supply.
* Every payment routes through one `charge()` path, so any shortfall opens a debt
  the player must clear by selling, mortgaging or folding. The turn alarm
  liquidates and folds automatically if a seat goes silent.
