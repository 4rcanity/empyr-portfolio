/**
 * The 63-square spiral and every rule that fires on it. Kept as pure functions
 * so the room only has to bookkeep seats and turns.
 */

import {
  BRIDGE_TO,
  GOAL,
  INN,
  squareKind,
  type Hop,
  type Punishment,
  type Rescue,
  type Rules,
} from './protocol';

/** Just enough of another seat to resolve wells, prisons and swaps. */
export interface Occupant {
  id: string;
  name: string;
  pos: number;
  stuck: boolean;
}

export interface Resolution {
  hops: Hop[];
  final: number;
  gooseHops: number;
  bounced: boolean;
  punishment: Punishment | null;
  rescue: Rescue | null;
  /** The mover is now held by a well or a prison. */
  stuck: boolean;
  /** Turns the mover owes the inn. */
  skips: number;
  swap: { playerId: string; name: string; to: number } | null;
  win: boolean;
}

/** Two honest dice. */
export function roll2(): [number, number] {
  const bytes = new Uint8Array(2);
  crypto.getRandomValues(bytes);
  return [(bytes[0] % 6) + 1, (bytes[1] % 6) + 1];
}

/**
 * Walk a throw out on the board.
 *
 * `firstThrow` enables the traditional opening: a 9 thrown as 3+6 runs straight
 * to 26, and as 4+5 runs straight to 53.
 */
export function resolveMove(
  rules: Rules,
  mover: { id: string; name: string; pos: number },
  dice: [number, number],
  others: Occupant[],
  firstThrow: boolean,
): Resolution {
  const total = dice[0] + dice[1];
  const out: Resolution = {
    hops: [],
    final: mover.pos,
    gooseHops: 0,
    bounced: false,
    punishment: null,
    rescue: null,
    stuck: false,
    skips: 0,
    swap: null,
    win: false,
  };

  if (rules.openingNines && firstThrow && mover.pos === 0 && total === 9) {
    const to = dice[0] === 3 || dice[1] === 3 ? 26 : 53;
    out.hops.push({ from: 0, to, why: 'opening' });
    out.final = to;
    return finish(rules, out, mover, others);
  }

  let pos = mover.pos;
  let why: Hop['why'] = 'roll';

  for (let guard = 0; guard < 24; guard++) {
    const raw = pos + total;
    let to = raw;
    if (raw > GOAL) {
      if (rules.exactFinish) {
        // 63 has to be hit exactly — the excess carries you back out again.
        to = GOAL - (raw - GOAL);
        out.hops.push({ from: pos, to: GOAL, why });
        out.hops.push({ from: GOAL, to, why: 'bounce' });
        out.bounced = true;
      } else {
        to = GOAL;
        out.hops.push({ from: pos, to, why });
      }
    } else {
      out.hops.push({ from: pos, to, why });
    }
    pos = to;

    const kind = squareKind(pos);

    if (kind === 'goal') {
      out.win = true;
      break;
    }

    if (kind === 'goose') {
      // A goose passes the throw straight on, and it chains.
      out.gooseHops++;
      why = 'goose';
      continue;
    }

    if (kind === 'bridge') {
      out.hops.push({ from: pos, to: BRIDGE_TO, why: 'bridge' });
      pos = BRIDGE_TO;
      break;
    }

    if (kind === 'maze') {
      out.hops.push({ from: pos, to: rules.mazeBack, why: 'maze' });
      out.punishment = { square: pos, kind, landsOn: rules.mazeBack };
      pos = rules.mazeBack;
      break;
    }

    if (kind === 'death') {
      out.hops.push({ from: pos, to: rules.deathTo, why: 'death' });
      out.punishment = { square: pos, kind, landsOn: rules.deathTo };
      pos = rules.deathTo;
      break;
    }

    if (kind === 'inn') {
      out.skips = rules.innTurns;
      out.punishment = { square: INN, kind, landsOn: INN, turns: rules.innTurns };
      break;
    }

    if (kind === 'well' || kind === 'prison') {
      const held = others.filter((other) => other.stuck && other.pos === pos);
      const freed = rules.wellFreesAll ? held : held.slice(0, 1);
      if (freed.length > 0) {
        out.rescue = { square: pos, freed: freed.map((p) => p.name), by: mover.name };
      }
      out.stuck = true;
      out.punishment = {
        square: pos,
        kind,
        landsOn: pos,
        company: held.map((p) => p.name),
      };
      break;
    }

    break;
  }

  out.final = pos;
  return finish(rules, out, mover, others);
}

/** House rule: trade places with whoever was already standing there. */
function finish(
  rules: Rules,
  out: Resolution,
  mover: { id: string; name: string; pos: number },
  others: Occupant[],
): Resolution {
  if (!rules.swapOnLanding || out.win || out.stuck || out.final <= 0 || out.final === mover.pos) {
    return out;
  }
  const sitting = others.find((other) => !other.stuck && other.pos === out.final && other.pos > 0);
  if (sitting) out.swap = { playerId: sitting.id, name: sitting.name, to: mover.pos };
  return out;
}

/** Ids freed by a rescue, resolved against the live seats. */
export function rescuedIds(others: Occupant[], square: number, all: boolean): string[] {
  const held = others.filter((other) => other.stuck && other.pos === square);
  return (all ? held : held.slice(0, 1)).map((p) => p.id);
}
