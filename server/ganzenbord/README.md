# empyr-ganzenbord

Multiplayer Ganzenbord (the Dutch Game of the Goose) on a Cloudflare Worker with
one Durable Object per room. Same shape as `server/uno` and `server/monopoly`:
the client renders, the server decides.

```
src/protocol.ts   wire types, square map, rule set, turn reports
src/board.ts      the 63-square spiral resolved as pure functions
src/room.ts       the Durable Object: seats, turn order, clock, idle protection
src/index.ts      worker routing → /room/:code/socket
```

## Run it

```sh
npm install
npx wrangler dev --port 8791     # 8787–8790 belong to the other games
```

The client picks the host up from `PUBLIC_GANZENBORD_HOST`, and falls back to
`localhost:8791` in dev.

## Scripts

| script | what it does |
| --- | --- |
| `node scripts/smoke.mjs [host]` | six bots play full games and the run fails unless it witnesses a goose chain, a bridge jump, a well/prison rescue, a death reset, an exact-63 bounce and an opening nine |
| `node scripts/bots.mjs <code> [count] [host]` | practice pawns so a room can be played solo |
| `node scripts/afk.mjs [host]` | proves an idle board is abandoned instead of re-arming its alarm forever (~95s) |
| `node scripts/shots.mjs [lang]` | headless screenshot pass over the real UI, including punishment windows raised by actual play |

## The rules, as implemented

Two dice, 63 squares, and every square resolved server-side.

- **Ganzen** on 5, 9, 14, 18, 23, 27, 32, 36, 41, 45, 50 and 54 pass the throw
  straight on, and they chain — landing on a goose from a goose flies again.
- **De brug** on 6 → 12.
- **De herberg** on 19 costs turns (`innTurns`, default 2). The pawn stays on 19
  and the turn order steps over it, burning one owed turn per pass.
- **De put** on 31 and **de gevangenis** on 52 hold the pawn until another player
  lands exactly there: the newcomer takes the hole, the occupants go free
  (`wellFreesAll`). If every pawn on the board ends up held, the one that has
  been waiting longest climbs out rather than deadlocking the table.
- **Het doolhof** on 42 → 39 (`mazeBack`, 30 for the French variant).
- **De dood** on 58 → the nest (`deathTo`, or square 1).
- **63** must be hit exactly; the excess bounces you back out (`exactFinish`),
  and the square you bounce onto resolves normally.
- Opening nines: a first throw of 3+6 runs to 26, 4+5 runs to 53
  (`openingNines`).
- House extra, off by default: `swapOnLanding` trades places with whoever was
  already standing on your landing square.

`variantOf(rules)` reports `traditional` or `house`, and the UI states which one
is running.

## Why the room looks the way it does

- Players join with a durable `key`, never the connection id, so a refresh
  returns to the same pawn instead of spawning a ghost.
- The turn clock throws for an absent player so one idle person cannot stall the
  table, but it parks itself when nobody is online and gives up entirely after
  `IDLE_LIMIT` clock-resolved turns. The reset wipes the log, so the
  "abandoned" notice is written *after* it.
- The host seat is reassigned when the host leaves, and an empty lobby is swept
  on a grace timer.
