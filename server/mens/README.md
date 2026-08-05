# EMPYR MENS — Mens erger je niet worker

Authoritative server for the cross-and-circle race game. One Durable Object per
room code holds the whole board; browsers only render what it sends and choose
between the moves it says are legal.

```
npm install
npm run dev          # wrangler dev on :8792
npm run smoke        # full bot games, asserts every rule fires
npm run afk          # proves an idle board is abandoned, ~2 min
```

## Routing

| Route | Purpose |
| --- | --- |
| `GET /` or `/health` | liveness JSON |
| `GET /room/:code/socket` | WebSocket upgrade into `MensRoom` |

## Board model

The cross is the boundary of a plus-shaped 11×11 grid, which is exactly 40
shared squares. The 17 interior cells are the four private home columns of four
squares each plus the decorative centre.

A pawn's position is progress along *its owner's* lap:

| Value | Meaning |
| --- | --- |
| `-1` | in the yard |
| `0…39` | on the shared ring — absolute square is `(start + pos) % 40` |
| `40…43` | in the home column, `43` being deepest |

Corner starts are ring squares 0, 10, 20 and 30. Two players sit on opposite
corners (0 and 2); three use corners 0, 1 and 2 and the fourth arm is closed.

## Rules implemented

- A six is needed to bring a pawn out of the yard onto its start square.
- A six grants another roll. `sixLimit` caps consecutive sixes: **3 by default**
  — you may roll three, and the third buys no further roll. `2` is stricter, and
  "unlimited" is capped internally at 10 so a table can never loop forever.
- With all four pawns in the yard you get `yardTries` (3) attempts at a six.
- Landing exactly on an opponent sends that pawn back to its yard.
- You may never land on your own pawn. Passing your own pawn on the ring is
  fine; inside your home column nothing may be jumped or shared.
- Home entry needs an exact roll. Overshooting the last home square is illegal,
  and if no legal move exists the turn passes.
- First player with all four pawns in the home column wins.

Variant switches (`Rules`, host-only, locked once the game starts):

| Setting | Default | Effect |
| --- | --- | --- |
| `sixLimit` | `3` | consecutive sixes allowed |
| `blockOnStart` | `on` | a pawn parked on its own start square cannot be passed or captured |
| `mustCapture` | `off` | if any option captures, the quiet options become illegal |
| `yardTries` | `3` | rolls allowed while every pawn is in the yard |
| `autoSingle` | `on` | a roll with exactly one legal move is played for you |
| `turnSeconds` | `45` | turn clock |
| `capacity` | `4` | seats |

## Turn protocol

`turnState` is `roll` or `move`. The player sends `{t:'roll'}`; the server rolls,
publishes `options` (the complete legal move set) and either plays the only
option itself (`autoSingle`) or waits for `{t:'move', pawn, to}`. Anything not in
`options` is refused with a `nope`.

## Liveness

- Players join with a durable `key`, so a refresh reclaims the same seat instead
  of creating a ghost.
- The turn clock auto-plays for an absent player — rolling, then picking the best
  available move — so one idle person cannot stall the board.
- The clock is **parked** whenever nobody is online, and after `IDLE_LIMIT` (8)
  consecutive clock-resolved steps the game is abandoned back to the lobby. The
  reset clears the feed, so the "abandoned" notice is written afterwards.
- The host badge moves to the next online player when the host leaves, and an
  empty lobby is swept on a 60 second grace alarm.
