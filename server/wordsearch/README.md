# EMPYR WORDSEARCH — realtime worker

Cloudflare Worker + Durable Object backing the head-to-head word search at
`/{lang}/minigames/wordsearch`. One Durable Object instance per room code,
addressed by `idFromName(code)`, so everyone in a room hunts the same
authoritative grid.

The server owns the grid, the word list and the claim ledger. Clients send
**coordinates only** — never a word — so a client cannot claim something it did
not legitimately trace.

## Endpoints

| Route | Purpose |
| --- | --- |
| `GET /` or `/health` | JSON health probe |
| `GET /room/:code/socket` | WebSocket upgrade into that room |

## Local development

```bash
npm run dev          # wrangler dev on port 8790
```

Point the site at it with `PUBLIC_WORDSEARCH_HOST=localhost:8790` in `.env`, or
just run the Astro dev server — the client falls back to `localhost:8790` in dev.

## Deploy

```bash
npm run deploy
```

## Grid generation

`src/grid.ts` is a pure function of a 32-bit seed (mulberry32), and the seed
travels in every room view, so any grid a player complains about can be rebuilt
exactly.

1. Take the chosen category and language, drop anything longer than the grid
   edge, and shuffle.
2. Sort the front of that shuffled pool longest-first. Long words have the
   fewest legal placements, so placing them into an empty board is what makes
   the requested word count reachable at all.
3. For each candidate, enumerate **every** legal placement across the eight
   directions — across, down, both diagonals, each forwards and backwards —
   scoring each by how many already-placed letters it reuses. Crossings are
   preferred 3 times out of 4, because a set of parallel words sitting in their
   own lanes is trivial to skim.
4. A word with no legal placement is skipped and the next word from the bank is
   tried. **The word list handed to players is built from the placements that
   landed**, never from the requested list, so a word can never be listed
   without being traceable. The count is also capped at `size² / 12`.
5. Remaining cells are filled from that language's letter-frequency table, not
   uniformly. Uniform noise makes real words leap off the page because common
   letters cluster around them.

## Word bank

`src/words.ts`, eight themes per language plus a `mixed` pool that is all of
them at once:

| | English | Dutch |
| --- | --- | --- |
| animals | 61 | 58 |
| food | 58 | 57 |
| countries | 56 | 56 |
| sport | 55 | 54 |
| nature | 56 | 55 |
| house | 56 | 55 |
| travel | 55 | 54 |
| tech | 55 | 54 |
| **mixed** | **449** | **440** |

Entries are plain `a–z` with diacritics already folded (`skiën` → `skien`), so
grid letters and traced letters compare without normalisation.

## Claiming

A claim is `{ t: 'claim', r1, c1, r2, c2 }`. The server:

1. Rejects coordinates that are not integers inside the grid.
2. Rejects endpoints that do not form one of the eight legal directions
   (`Δrow === 0`, `Δcol === 0`, or `|Δrow| === |Δcol|`) or that span fewer than
   three cells.
3. Reads the letters along the line and looks for an **unclaimed** word whose
   spelling matches forwards or backwards.
4. Only then awards it, stamping the claimant and the winning path.

Two players racing for one word resolve by message order: a Durable Object
handles one message at a time, so exactly one claim can be first. The loser gets
a `steal` effect naming the word and the winner, and their claim is refused.

Scoring rewards speed as well as correctness: `length × 10` base, plus up to the
same again scaled by the fraction of the round clock still left — a seven-letter
word found early is worth roughly double the same word found at the death.

## Idle protection

An abandoned room must not keep re-arming its alarm, which would keep the
Durable Object alive indefinitely.

- Both clocks (the round clock and the results-screen countdown) are **parked**
  the moment the last player goes offline, and wound back up on rejoin with the
  time that was left.
- If the clock resolves a round in which **nobody found a single word**, that
  counts as an idle round. Two of those in a row and the room drops back to the
  lobby. Any claim resets the counter.
- Falling back to the lobby wipes the feed, so the `abandoned` notice is written
  *after* the reset — otherwise it would be wiped immediately.
- The host is reassigned to the longest-seated player still online when the host
  leaves, and offline players are swept from an idle lobby on a 60 second grace
  timer.

## Test scripts

### `scripts/smoke.mjs`

Four bots on one grid, across four configurations (English mixed over two
rounds, Dutch animals, a 10×10 and a 20×20). Asserts:

- every listed word is genuinely findable in the grid, and unclaimed words never
  leak their coordinates
- a round starts and words get claimed by more than one player
- a word four bots claim in the same breath goes to exactly one of them
- a bent line, a two-cell trace, an out-of-bounds trace and a run of filler
  letters are all refused
- every scoreboard total equals the sum of the points printed against that
  player's words, per round and overall
- the game ends after the configured rounds with the top scorer as winner

```bash
node scripts/smoke.mjs                 # against localhost:8790
node scripts/smoke.mjs empyr-wordsearch.<subdomain>.workers.dev
```

### `scripts/afk.mjs`

Idle-protection regression guard. Two players start a three-round game on the
shortest legal clock and then do nothing; the room must fall back to the lobby
with an `abandoned` notice, no clocks running and no grid left on the table.
Takes about 80 seconds.

```bash
node scripts/afk.mjs
```

### `scripts/bots.mjs`

Fills a real room with practice bots so one human can test the UI.

```bash
node scripts/bots.mjs <roomCode> [count] [host]
```

They ready up, hunt at human pace, and only start the game themselves if no
human took the host seat.
