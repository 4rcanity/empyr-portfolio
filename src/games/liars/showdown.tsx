import { useEffect, useMemo, useRef, useState } from 'react';
import type { Copy } from './copy';
import { tableLabel } from './copy';
import { Gun, PlayingCard } from './parts';
import { play } from './sfx';
import type { Card, Showdown, Stage } from './protocol';

type ShowdownBeat = 'reveal' | 'verdict' | 'shooter' | 'gun' | 'hold';

interface ShowdownOverlayProps {
  stage: Stage;
  copy: Copy;
  skewMs: number;
  waiting: number;
  seated: number;
  youWaiting: boolean;
  onMoveOn: () => void;
  isHost: boolean;
  moveLabel: string;
}

/** Animation beats sized to fit the server stage budget (~4600 + count*750 ms). */
function beatsFor(showdown: Showdown | null): { reveal: number; verdict: number; shooter: number; gun: number } {
  if (!showdown) return { reveal: 0, verdict: 600, shooter: 0, gun: 0 };
  const reveal = showdown.count * 750;
  return { reveal, verdict: 900, shooter: 900, gun: 1800 };
}

function beatAt(elapsed: number, showdown: Showdown | null): ShowdownBeat {
  if (!showdown) return elapsed < 600 ? 'verdict' : 'hold';
  const { reveal, verdict, shooter, gun } = beatsFor(showdown);
  if (elapsed < reveal) return 'reveal';
  if (elapsed < reveal + verdict) return 'verdict';
  if (elapsed < reveal + verdict + shooter) return 'shooter';
  if (elapsed < reveal + verdict + shooter + gun) return 'gun';
  return 'hold';
}

function revealedCount(elapsed: number, showdown: Showdown): number {
  return Math.min(showdown.count, Math.floor(elapsed / 750) + 1);
}

export function ShowdownOverlay({
  stage,
  copy,
  skewMs,
  waiting,
  seated,
  youWaiting,
  onMoveOn,
  isHost,
  moveLabel,
}: ShowdownOverlayProps) {
  const showdown = stage.showdown;
  const [, setTick] = useState(0);
  const sfxRef = useRef({ gun: false, verdict: false, quiet: false });

  useEffect(() => {
    sfxRef.current = { gun: false, verdict: false, quiet: false };
  }, [stage.id]);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((n) => n + 1), 80);
    return () => window.clearInterval(timer);
  }, []);

  const now = Date.now() + skewMs;
  const elapsed = Math.max(0, now - stage.startedAt);
  const beat = beatAt(elapsed, showdown);
  const challenged = Boolean(showdown);

  useEffect(() => {
    if (!showdown && beat === 'verdict' && !sfxRef.current.quiet) {
      sfxRef.current.quiet = true;
      play('quiet');
    }
    if (showdown && beat === 'verdict' && !sfxRef.current.verdict) {
      sfxRef.current.verdict = true;
      play(showdown.honest ? 'good' : 'bad');
    }
    if (showdown && beat === 'gun' && !sfxRef.current.gun) {
      sfxRef.current.gun = true;
      play(showdown.fatal ? 'bang' : 'click');
    }
  }, [beat, showdown]);

  const cardsShown = showdown ? revealedCount(elapsed, showdown) : 0;
  const timing = beatsFor(showdown);
  const gunPhase = beat === 'gun';
  const gunDone =
    beat === 'hold' ||
    (gunPhase && showdown !== null && elapsed > timing.reveal + timing.verdict + timing.shooter + 900);

  const cards: Card[] = useMemo(
    () => (showdown ? showdown.revealed.slice(0, cardsShown).map((rank, i) => ({ id: `r${i}`, rank })) : []),
    [showdown, cardsShown],
  );

  return (
    <div className="lb-veil" data-challenge={challenged ? 'true' : 'false'}>
      <div className="lb-lamp" aria-hidden="true" />
      <div className="lb-oxide" aria-hidden="true" />

      <div className="lb-showdown">
        {!showdown && (
          <>
            <div className="lb-eyebrow">{copy.showdownQuiet}</div>
            <p className="lb-showdown-quiet">{copy.showdownQuiet}</p>
          </>
        )}

        {showdown && (
          <>
            <div className="lb-eyebrow">{copy.showdownReveal}</div>
            <div className="lb-revealed">
              {cards.map((card) => (
                <PlayingCard key={card.id} card={card} copy={copy} />
              ))}
              {Array.from({ length: Math.max(0, showdown.count - cardsShown) }).map((_, i) => (
                <PlayingCard key={`back-${i}`} card={{ id: `b${i}`, rank: 'ace' }} copy={copy} faceDown />
              ))}
            </div>

            {(beat === 'verdict' || beat === 'shooter' || beat === 'gun' || beat === 'hold') && (
              <div className="lb-verdict" data-honest={showdown.honest ? 'true' : 'false'}>
                {showdown.honest ? copy.showdownHonest : copy.showdownLied}
                <span className="lb-verdict-sub">
                  {showdown.accusedName} · {tableLabel(showdown.table, copy)}
                </span>
              </div>
            )}

            {(beat === 'shooter' || beat === 'gun' || beat === 'hold') && (
              <div className="lb-shooter-line">
                <span>{copy.showdownShooter}</span>
                <strong>{showdown.shooterName}</strong>
                <span className="lb-odds">
                  {copy.showdownOdds} {showdown.oddsIn}
                </span>
              </div>
            )}

            {(beat === 'gun' || beat === 'hold') && (
              <div className="lb-gun-stage">
                <Gun
                  chamber={showdown.chamber}
                  chambersTotal={showdown.chambersTotal}
                  spinning={gunPhase && !gunDone}
                  fired={gunDone}
                  fatal={showdown.fatal}
                />
                <div className="lb-gun-label" data-fatal={showdown.fatal ? 'true' : 'false'}>
                  {showdown.fatal ? copy.showdownBang : copy.showdownClick}
                </div>
              </div>
            )}
          </>
        )}

        <div className="lb-stage-foot">
          <p className="lb-hint">
            {waiting}/{seated} · {copy.waitingOn}
          </p>
          <button type="button" className="lb-btn" data-ghost={youWaiting} disabled={youWaiting} onClick={onMoveOn}>
            {isHost && challenged ? copy.skipStage : moveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
