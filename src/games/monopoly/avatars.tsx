/** Seat identity for EMPYR LEDGER.
 *
 *  Every player is a struck brass seal: one saturated seat colour plus a geometric
 *  house mark. The marks are deliberately different silhouettes rather than different
 *  hues of the same blob, so a seat is still identifiable in greyscale or by a player
 *  who cannot separate the colours. The same seal is used on the board, in the seat
 *  list, in trades and in the auction, so a colour always means the same person.
 */

import type { CSSProperties, ReactElement } from 'react';
import { TOKEN_INK, TOKEN_MARK, TOKEN_ON, seatIndex, type SeatMark } from './board';
import type { PlayerView } from './protocol';

const MARKS: Record<SeatMark, ReactElement> = {
  ring: (
    <>
      <circle cx="12" cy="12" r="6.6" fill="none" stroke="currentColor" strokeWidth="2.6" />
      <circle cx="12" cy="12" r="1.7" fill="currentColor" />
    </>
  ),
  spire: <path d="M12 4.4 19.3 18H4.7Z" fill="currentColor" />,
  lozenge: <path d="M12 3.6 20.4 12 12 20.4 3.6 12Z" fill="currentColor" />,
  star: (
    <path
      d="M12 3.2 14.1 9.9 20.8 12 14.1 14.1 12 20.8 9.9 14.1 3.2 12 9.9 9.9Z"
      fill="currentColor"
    />
  ),
  hex: <path d="M12 3.4 19.4 7.7v8.6L12 20.6 4.6 16.3V7.7Z" fill="currentColor" />,
  crescent: (
    <path
      d="M17.6 18.2A7.8 7.8 0 1 1 17.6 5.8 9.6 9.6 0 0 0 17.6 18.2Z"
      fill="currentColor"
    />
  ),
  cross: <path d="M9.7 3.6h4.6v6.1h6.1v4.6h-6.1v6.1H9.7v-6.1H3.6V9.7h6.1Z" fill="currentColor" />,
  chevron: (
    <path
      d="M5.2 5.4 12 10.2l6.8-4.8 1.9 3.2L12 15.1 3.3 8.6ZM5.2 13.1 12 17.9l6.8-4.8 1.9 3.2L12 22.8 3.3 16.3Z"
      fill="currentColor"
    />
  ),
};

export type SealSize = 'board' | 'seat' | 'inline';

interface SealProps {
  token: number;
  /** Rendered for screen readers when the seal stands alone. */
  label?: string;
  size?: SealSize;
  turn?: boolean;
  out?: boolean;
}

/** The seal itself, with no layout opinion beyond its own square. */
export function Seal({ token, label, size = 'seat', turn = false, out = false }: SealProps) {
  const seat = seatIndex(token);
  const style = {
    ['--seat']: TOKEN_INK[seat],
    ['--seat-on']: TOKEN_ON[seat],
  } as CSSProperties;

  return (
    <span
      className="mp-seal"
      data-size={size}
      data-turn={turn}
      data-out={out}
      style={style}
      role={label ? 'img' : 'presentation'}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
        {MARKS[TOKEN_MARK[seat]]}
      </svg>
    </span>
  );
}

/** Seal plus name, for anywhere a player is mentioned in prose or a list. */
export function PlayerChip({
  player,
  size = 'inline',
  turn = false,
}: {
  player: PlayerView;
  size?: SealSize;
  turn?: boolean;
}) {
  return (
    <span className="mp-who">
      <Seal token={player.token} size={size} turn={turn} out={player.bankrupt} />
      <span className="mp-who-name">{player.name}</span>
    </span>
  );
}
