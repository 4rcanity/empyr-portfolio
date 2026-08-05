/** Compact board metadata for the headless harnesses. Mirrors src/board.ts. */

const street = (group, price, houseCost) => ({ kind: 'street', group, price, houseCost });
const other = (kind) => ({ kind, group: null, price: 0, houseCost: 0 });
const rail = () => ({ kind: 'rail', group: 'rail', price: 200, houseCost: 0 });
const util = () => ({ kind: 'util', group: 'util', price: 150, houseCost: 0 });

export const TILES = [
  other('go'),
  street('brown', 60, 50),
  other('ledger'),
  street('brown', 60, 50),
  other('tax'),
  rail(),
  street('lblue', 100, 50),
  other('fortune'),
  street('lblue', 100, 50),
  street('lblue', 120, 50),
  other('jail'),
  street('pink', 140, 100),
  util(),
  street('pink', 140, 100),
  street('pink', 160, 100),
  rail(),
  street('orange', 180, 100),
  other('ledger'),
  street('orange', 180, 100),
  street('orange', 200, 100),
  other('vacation'),
  street('red', 220, 150),
  other('fortune'),
  street('red', 220, 150),
  street('red', 240, 150),
  rail(),
  street('yellow', 260, 150),
  street('yellow', 260, 150),
  util(),
  street('yellow', 280, 150),
  other('arrest'),
  street('green', 300, 200),
  street('green', 300, 200),
  other('ledger'),
  street('green', 320, 200),
  rail(),
  other('fortune'),
  street('dblue', 350, 200),
  other('tax'),
  street('dblue', 400, 200),
];

export const GROUPS = {};
TILES.forEach((tile, i) => {
  if (!tile.group) return;
  (GROUPS[tile.group] ??= []).push(i);
});

export const OWNABLE = TILES.map((tile, i) => (tile.group ? i : -1)).filter((i) => i >= 0);
