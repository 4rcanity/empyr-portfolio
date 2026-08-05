import { plural, type Copy } from './copy';
import { inkFor } from './parts';
import type { Inbound, RoomView, Rules } from './protocol';

function Toggle({
  label,
  hint,
  on,
  disabled,
  onChange,
  copy,
}: {
  label: string;
  hint: string;
  on: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
  copy: Copy;
}) {
  return (
    <div className={`gb-rule${disabled ? ' is-locked' : ''}`}>
      <div className="gb-rule-text">
        <b>{label}</b>
        <span>{hint}</span>
      </div>
      <button
        type="button"
        className={`gb-switch${on ? ' is-on' : ''}`}
        aria-pressed={on}
        disabled={disabled}
        onClick={() => onChange(!on)}
      >
        <span className="gb-switch-knob" aria-hidden="true" />
        <span className="gb-switch-word">{on ? copy.on : copy.off}</span>
      </button>
    </div>
  );
}

function Choice<T extends string | number>({
  label,
  hint,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  hint: string;
  value: T;
  options: { value: T; label: string }[];
  disabled: boolean;
  onChange: (next: T) => void;
}) {
  return (
    <div className={`gb-rule${disabled ? ' is-locked' : ''}`}>
      <div className="gb-rule-text">
        <b>{label}</b>
        <span>{hint}</span>
      </div>
      <div className="gb-seg" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            className={`gb-seg-btn${option.value === value ? ' is-on' : ''}`}
            aria-pressed={option.value === value}
            disabled={disabled}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Lobby({
  copy,
  room,
  youId,
  send,
}: {
  copy: Copy;
  room: RoomView;
  youId: string;
  send: (message: Inbound) => void;
}) {
  const you = room.players.find((player) => player.id === youId);
  const host = Boolean(you?.host);
  const locked = !host;
  const rules = room.rules;
  const patch = (part: Partial<Rules>) => send({ t: 'rules', patch: part });
  const enough = room.players.length >= 2;
  const allReady = room.players.every((player) => player.ready || player.host);

  return (
    <div className="gb-lobby">
      <section className="gb-panel gb-lobby-intro">
        <h2>{copy.lobbyTitle}</h2>
        <p>{copy.lobbySub}</p>
        <div className={`gb-variant is-${room.variant}`}>
          <span className="gb-variant-tag">{copy.variantTitle}</span>
          <b>{copy.variantNames[room.variant]}</b>
          <span>{copy.variantNote[room.variant]}</span>
          {host && room.variant === 'house' && (
            <button type="button" className="gb-btn is-ghost is-tiny" onClick={() => send({ t: 'preset', name: 'traditional' })}>
              {copy.restore}
            </button>
          )}
        </div>
      </section>

      <section className="gb-panel">
        <h3>{copy.rulesHeading}</h3>
        <p className="gb-panel-sub">{host ? copy.variantSub : copy.hostOnly}</p>

        <Toggle
          copy={copy}
          label={copy.openingNines}
          hint={copy.openingNinesHint}
          on={rules.openingNines}
          disabled={locked}
          onChange={(on) => patch({ openingNines: on })}
        />
        <Choice
          label={copy.innTurns}
          hint={copy.innTurnsHint}
          value={rules.innTurns}
          disabled={locked}
          options={[1, 2, 3].map((n) => ({
            value: n,
            label: `${n} ${plural(n, copy.turnOne, copy.turnMany)}`,
          }))}
          onChange={(n) => patch({ innTurns: n })}
        />
        <Choice
          label={copy.mazeBack}
          hint={copy.mazeBackHint}
          value={rules.mazeBack}
          disabled={locked}
          options={[
            { value: 39, label: '42 → 39' },
            { value: 30, label: '42 → 30' },
          ]}
          onChange={(n) => patch({ mazeBack: n })}
        />
        <Choice
          label={copy.deathTo}
          hint={copy.deathToHint}
          value={rules.deathTo}
          disabled={locked}
          options={[
            { value: 0, label: copy.deathNest },
            { value: 1, label: copy.deathOne },
          ]}
          onChange={(n) => patch({ deathTo: n })}
        />
        <Toggle
          copy={copy}
          label={copy.wellFreesAll}
          hint={copy.wellFreesAllHint}
          on={rules.wellFreesAll}
          disabled={locked}
          onChange={(on) => patch({ wellFreesAll: on })}
        />
        <Toggle
          copy={copy}
          label={copy.exactFinish}
          hint={copy.exactFinishHint}
          on={rules.exactFinish}
          disabled={locked}
          onChange={(on) => patch({ exactFinish: on })}
        />
        <Toggle
          copy={copy}
          label={copy.swapOnLanding}
          hint={copy.swapOnLandingHint}
          on={rules.swapOnLanding}
          disabled={locked}
          onChange={(on) => patch({ swapOnLanding: on })}
        />

        <div className="gb-sliders">
          <label className="gb-slider">
            <span>
              {copy.turnClock} <b>{rules.turnSeconds}</b> {copy.seconds}
            </span>
            <input
              type="range"
              min="10"
              max="120"
              step="5"
              value={rules.turnSeconds}
              disabled={locked}
              onChange={(event) => patch({ turnSeconds: Number(event.target.value) })}
            />
          </label>
          <label className="gb-slider">
            <span>
              {copy.maxSeats} <b>{rules.capacity}</b>
            </span>
            <input
              type="range"
              min="2"
              max="6"
              step="1"
              value={rules.capacity}
              disabled={locked}
              onChange={(event) => patch({ capacity: Number(event.target.value) })}
            />
          </label>
        </div>
      </section>

      <section className="gb-panel">
        <h3>
          {copy.playersHeading} <em>{room.players.length}/{rules.capacity}</em>
        </h3>
        <ul className="gb-roster">
          {room.players.map((player) => (
            <li key={player.id} className={player.ready || player.host ? 'is-ready' : ''}>
              <span className="gb-chip" style={{ background: inkFor(player.seat) }} aria-hidden="true" />
              <b>{player.name}</b>
              {player.id === youId && <em>{copy.you}</em>}
              {player.host ? <span className="gb-tag">{copy.hostTag}</span> : null}
              <span className="gb-roster-state">
                {player.ready || player.host ? copy.ready : copy.unready}
              </span>
            </li>
          ))}
        </ul>

        <div className="gb-lobby-actions">
          <button
            type="button"
            className={`gb-btn${you?.ready ? ' is-ghost' : ''}`}
            onClick={() => send({ t: 'ready', on: !you?.ready })}
          >
            {you?.ready ? copy.unready : copy.ready}
          </button>
          {host ? (
            <button
              type="button"
              className="gb-btn is-accent"
              disabled={!enough || !allReady}
              onClick={() => send({ t: 'begin' })}
            >
              {enough ? copy.start : copy.needTwo}
            </button>
          ) : (
            <span className="gb-wait">{copy.waitingHost}</span>
          )}
        </div>
      </section>
    </div>
  );
}
