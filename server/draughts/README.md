# empyr-draughts — DAMCAFÉ

Cloudflare Worker + Durable Object behind **DAMCAFÉ**, the international
draughts (Dutch *dammen*) table: 10×10 board, 20 men a side, played on the dark
squares numbered 1–50.

```
npm install
npm run dev          # wrangler dev on :8794
npm run perft        # engine proof: perft + rule fixtures
npm run smoke        # scripted play-through against a running worker
npm run bots         # multi-table soak
npm run afk          # idle / abandon regression
```

## Layout

| File               | What it is                                                        |
| ------------------ | ----------------------------------------------------------------- |
| `src/protocol.ts`  | wire types, board encoding, notation — mirrored in the client      |
| `src/engine.ts`    | the rules: move generation, maximum capture, flying kings, FEN     |
| `src/room.ts`      | the Durable Object: seats, clocks, draws, idle protection          |
| `src/index.ts`     | routes `/room/:code/socket` to the object                          |

## The engine

Squares 1–50 map onto the dark squares of a 10×10 grid, row-major from black's
back row. Rays along all four diagonals are precomputed once, so generation is
table lookups.

Capture sequences are enumerated by depth-first search with the moving piece
**lifted off the board** and captured pieces **left standing**. That single
choice is what makes three separate rules fall out for free:

- a sequence may cross its own origin, and any square it has already flown over,
  as often as it likes;
- a piece can never be captured twice, because it is still in the way;
- a flying king cannot pass over a piece it has already taken.

Captures are compulsory, and only the sequences taking the greatest number of
pieces are returned. All of the tied sequences are legal — the room publishes one
entry per distinct **route**, so the client can offer a genuine choice between
two ways round the same haul and between a king's landing squares. `distinctMoves`
collapses those routes to the FMJD definition of a move (same origin, same
landing square, same captured set) for perft and notation.

A man promotes only when the move *ends* on the far row; one that merely passes
through mid-sequence stays a man for the rest of the sequence.

### Verified against published perft

`node scripts/perft.mjs [depth]` compares against the published node counts for
10×10 international draughts and then runs crafted fixtures for maximum capture,
tied hauls, crossing a square twice and the mid-chain promotion rule.

| depth | nodes     |
| ----- | --------- |
| 1     | 9         |
| 2     | 81        |
| 3     | 658       |
| 4     | 4265      |
| 5     | 27117     |
| 6     | 167140    |
| 7     | 1049442   |
| 8     | 6483961   |

## Draw rules

- threefold repetition of the same position with the same side to move;
- 50 plies (25 moves each) in which only kings moved and nothing was captured;
- three pieces against a lone king: drawn after 32 plies;
- two pieces against a lone king: drawn after 10 plies;
- draw by agreement.

The reduced-material counters reset whenever the material changes.

## Room behaviour

- **Stable identity.** `hello` carries a durable `key`, not the connection id, so
  a refresh returns the player to the same seat with the same clock.
- **Clocks are server-owned.** Optional, with a Fischer increment. The clock is
  *parked* — time banked, alarm dropped — the moment no seated player is online,
  so nobody is flagged for a disconnection.
- **Bounded idle.** With nobody connected the room drops back to the lobby after
  90 seconds; a clockless game with someone present gives up after 10 minutes.
  The reset clears the log, so the abandonment notice is written afterwards.
  `scripts/afk.mjs` proves both the parking and the abandonment, and checks that
  a player *thinking* with the clock running is left alone.
- **Host reassignment** on disconnect, and an empty-lobby sweep on a 60 second
  grace timer.
- Two seats plus unlimited spectators. Spectators receive every sync and are
  refused any move.
- `setup` lets the host load a position in PDN FEN form (`W:W31,K35:B12,K19`)
  before the game starts. The scripted tests use it to reach positions a random
  game would take hours to find.

Every move is validated server-side against a freshly generated move list; the
client's highlighting is only a hint. Rejections explain themselves — quiet move
while a capture exists, capture smaller than the maximum, ambiguous route.
