import { useId, useMemo, useState } from 'react';
import type { Crosshair, RunResult } from './engine';
import { DEFAULT_CROSSHAIR } from './engine';
import type { Copy, Lang } from './copy';
import { SCENARIOS, defaultConfig, LIMITS, type RunConfig, type ScenarioId } from './scenarios';
import {
  GAMES,
  conversionTable,
  countsPer360,
  degPerCount,
  edpi,
  profileOf,
  sensForCm360,
  cm360 as cmFor,
} from './sens';
import type { SensSettings, Vault } from './storage';
import { personalBest, recentAverage } from './storage';
import { Compare, Histogram, Scatter, Timeline } from './charts';

export function num(lang: Lang, value: number, places = 0): string {
  if (!Number.isFinite(value)) return '∞';
  return value.toLocaleString(lang === 'nl' ? 'nl-NL' : 'en-GB', {
    minimumFractionDigits: places,
    maximumFractionDigits: places,
  });
}

export function pct(lang: Lang, value: number, places = 1): string {
  return `${num(lang, value * 100, places)}%`;
}

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="ar-stat">
      <span className="ar-stat-label">{label}</span>
      <strong className="ar-stat-value">{value}</strong>
      {sub ? <span className="ar-stat-sub">{sub}</span> : null}
    </div>
  );
}

interface NumberFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}

export function NumberField({ label, value, min, max, step, suffix, onChange }: NumberFieldProps) {
  const id = useId();
  return (
    <label className="ar-field" htmlFor={id}>
      <span className="ar-field-label">{label}</span>
      <span className="ar-field-box">
        <input
          id={id}
          type="number"
          value={Number.isFinite(value) ? value : ''}
          min={min}
          max={max}
          step={step}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        {suffix ? <span className="ar-field-suffix">{suffix}</span> : null}
      </span>
    </label>
  );
}

export function RangeField({ label, value, min, max, step, suffix, onChange }: NumberFieldProps) {
  const id = useId();
  return (
    <div className="ar-range">
      <label htmlFor={id}>
        <span className="ar-field-label">{label}</span>
        <output>
          {value}
          {suffix ?? ''}
        </output>
      </label>
      <input
        id={id}
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

/* ---- setup ------------------------------------------------------------- */

const DURATIONS = [30, 60, 120];

export function SetupPanel({
  copy,
  id,
  config,
  onChange,
  onStart,
}: {
  copy: Copy;
  id: ScenarioId;
  config: RunConfig;
  onChange: (config: RunConfig) => void;
  onStart: () => void;
}) {
  const scenario = copy.scenarios[id];
  const def = SCENARIOS[id];
  const trackOnly = def.mode !== 'click';

  return (
    <div className="ar-setup">
      <div className="ar-setup-head">
        <p className="ar-eyebrow">{copy.setup}</p>
        <h2>{scenario.name}</h2>
        <p className="ar-muted">{scenario.desc}</p>
        <p className="ar-hint">{scenario.hint}</p>
      </div>

      <div className="ar-setup-group">
        <span className="ar-field-label">{copy.duration}</span>
        <div className="ar-chips">
          {DURATIONS.map((seconds) => (
            <button
              type="button"
              key={seconds}
              className={config.duration === seconds ? 'ar-chip ar-chip-on' : 'ar-chip'}
              aria-pressed={config.duration === seconds}
              onClick={() => onChange({ ...config, duration: seconds })}
            >
              {seconds}
              {copy.seconds}
            </button>
          ))}
          <NumberField
            label={copy.custom}
            value={config.duration}
            min={LIMITS.duration.min}
            max={LIMITS.duration.max}
            step={LIMITS.duration.step}
            suffix={copy.seconds}
            onChange={(duration) => onChange({ ...config, duration })}
          />
        </div>
      </div>

      <RangeField
        label={copy.targetSize}
        value={config.size}
        min={LIMITS.size.min}
        max={LIMITS.size.max}
        step={LIMITS.size.step}
        suffix={copy.degrees}
        onChange={(size) => onChange({ ...config, size })}
      />
      {!trackOnly || id === 'switch' ? (
        <RangeField
          label={copy.targetCount}
          value={config.targets}
          min={LIMITS.targets.min}
          max={LIMITS.targets.max}
          step={LIMITS.targets.step}
          onChange={(targets) => onChange({ ...config, targets })}
        />
      ) : null}
      <RangeField
        label={copy.spawnArea}
        value={config.area}
        min={LIMITS.area.min}
        max={LIMITS.area.max}
        step={LIMITS.area.step}
        suffix={copy.degrees}
        onChange={(area) => onChange({ ...config, area })}
      />

      <div className="ar-setup-actions">
        <button type="button" className="ar-btn ar-btn-ghost" onClick={() => onChange(defaultConfig(id))}>
          {copy.reset}
        </button>
        <button type="button" className="ar-btn ar-btn-hot" onClick={onStart}>
          {copy.start}
        </button>
      </div>

    </div>
  );
}

/* ---- sensitivity ------------------------------------------------------- */

export function SensPanel({
  copy,
  lang,
  sens,
  onChange,
}: {
  copy: Copy;
  lang: Lang;
  sens: SensSettings;
  onChange: (sens: SensSettings) => void;
}) {
  const [wanted, setWanted] = useState(40);
  const profile = profileOf(sens.source);
  const perCount = degPerCount(profile.yaw, sens.sens);
  const counts = countsPer360(profile.yaw, sens.sens);
  const cm = cmFor(profile.yaw, sens.sens, sens.dpi);
  const rows = useMemo(() => conversionTable(sens.sens, sens.dpi, sens.source), [sens]);

  return (
    <div className="ar-panel-stack">
      <section className="ar-card">
        <p className="ar-eyebrow">{copy.sensTitle}</p>
        <p className="ar-muted">{copy.sensSub}</p>

        <div className="ar-grid-2">
          <label className="ar-field">
            <span className="ar-field-label">{copy.sourceGame}</span>
            <span className="ar-field-box">
              <select
                value={sens.source}
                onChange={(event) => onChange({ ...sens, source: event.target.value as SensSettings['source'] })}
              >
                {GAMES.map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.label}
                  </option>
                ))}
              </select>
            </span>
          </label>
          <NumberField
            label={copy.inGameSens}
            value={sens.sens}
            min={0.01}
            max={20}
            step={0.01}
            onChange={(value) => onChange({ ...sens, sens: value })}
          />
          <NumberField
            label={copy.mouseDpi}
            value={sens.dpi}
            min={100}
            max={32000}
            step={50}
            onChange={(value) => onChange({ ...sens, dpi: value })}
          />
          <NumberField
            label={copy.fov}
            value={sens.fov}
            min={60}
            max={130}
            step={1}
            suffix="°"
            onChange={(value) => onChange({ ...sens, fov: value })}
          />
        </div>

        <label className="ar-check">
          <input
            type="checkbox"
            checked={sens.invertY}
            onChange={(event) => onChange({ ...sens, invertY: event.target.checked })}
          />
          <span>{copy.invertY}</span>
        </label>

        <div className="ar-stats ar-stats-4">
          <Stat label={copy.edpi} value={num(lang, edpi(sens.sens, sens.dpi), 0)} />
          <Stat label={copy.cm360} value={num(lang, cm, 2)} />
          <Stat label={copy.in360} value={num(lang, cm / 2.54, 2)} />
          <Stat label={copy.degPerCount} value={num(lang, perCount, 4)} />
        </div>
      </section>

      <section className="ar-card">
        <p className="ar-eyebrow">{copy.workingTitle}</p>
        <p className="ar-muted">{copy.workingSub}</p>
        <ol className="ar-working">
          <li>
            <code>eDPI = sens × DPI</code>
            <span>
              = {num(lang, sens.sens, 3)} × {num(lang, sens.dpi, 0)} = <b>{num(lang, edpi(sens.sens, sens.dpi), 0)}</b>
            </span>
          </li>
          <li>
            <code>°/count = yaw × sens</code>
            <span>
              = {num(lang, profile.yaw, 4)} × {num(lang, sens.sens, 3)} = <b>{num(lang, perCount, 5)}°</b>
            </span>
          </li>
          <li>
            <code>counts/360 = 360 ÷ (yaw × sens)</code>
            <span>
              = 360 ÷ {num(lang, perCount, 5)} = <b>{num(lang, counts, 1)}</b>
            </span>
          </li>
          <li>
            <code>cm/360 = counts/360 ÷ DPI × 2.54</code>
            <span>
              = {num(lang, counts, 1)} ÷ {num(lang, sens.dpi, 0)} × 2.54 = <b>{num(lang, cm, 3)} cm</b>
            </span>
          </li>
        </ol>
      </section>

      <section className="ar-card">
        <p className="ar-eyebrow">{copy.tableTitle}</p>
        <p className="ar-muted">{copy.tableSub}</p>
        <div className="ar-table-wrap">
          <table className="ar-table">
            <thead>
              <tr>
                <th scope="col">{copy.colGame}</th>
                <th scope="col">{copy.colYaw}</th>
                <th scope="col">{copy.colSens}</th>
                <th scope="col">{copy.colEdpi}</th>
                <th scope="col">{copy.colCm}</th>
                <th scope="col">{copy.colIn}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.game.id} className={row.game.id === sens.source ? 'ar-row-on' : undefined}>
                  <th scope="row">
                    {row.game.label}
                    <small>{row.game.note}</small>
                  </th>
                  <td>{num(lang, row.game.yaw, 4)}</td>
                  <td>{num(lang, row.sens, 3)}</td>
                  <td>{num(lang, row.edpi, 0)}</td>
                  <td>{num(lang, row.cm360, 2)}</td>
                  <td>{num(lang, row.inch360, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ar-card">
        <p className="ar-eyebrow">{copy.matchCm}</p>
        <p className="ar-muted">{copy.matchCmSub}</p>
        <div className="ar-inline">
          <NumberField
            label={copy.cm360}
            value={wanted}
            min={1}
            max={200}
            step={0.5}
            suffix="cm"
            onChange={setWanted}
          />
          <p className="ar-solve">
            → {profile.label} <b>{num(lang, sensForCm360(profile.yaw, sens.dpi, wanted), 3)}</b> @{' '}
            {num(lang, sens.dpi, 0)} DPI
          </p>
          <button
            type="button"
            className="ar-btn ar-btn-ghost"
            onClick={() =>
              onChange({ ...sens, sens: Math.round(sensForCm360(profile.yaw, sens.dpi, wanted) * 1000) / 1000 })
            }
          >
            {copy.apply}
          </button>
        </div>
      </section>
    </div>
  );
}

/* ---- crosshair --------------------------------------------------------- */

const SWATCHES = ['#00ff9c', '#ffffff', '#ffe94d', '#00e5ff', '#ff4655', '#ff8bd1'];

export function CrosshairPreview({ crosshair, size = 120 }: { crosshair: Crosshair; size?: number }) {
  const mid = size / 2;
  const { thickness, gap, length, colour, dot, outline } = crosshair;
  const arms = [
    { x: mid - thickness / 2, y: mid - gap - length, w: thickness, h: length },
    { x: mid - thickness / 2, y: mid + gap, w: thickness, h: length },
    { x: mid - gap - length, y: mid - thickness / 2, w: length, h: thickness },
    { x: mid + gap, y: mid - thickness / 2, w: length, h: thickness },
  ];
  return (
    <svg className="ar-cross-preview" viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
      <rect width={size} height={size} fill="#151b21" />
      {outline
        ? arms.map((arm, i) => (
            <rect key={`o${i}`} x={arm.x - 1} y={arm.y - 1} width={arm.w + 2} height={arm.h + 2} fill="rgba(0,0,0,0.85)" />
          ))
        : null}
      {arms.map((arm, i) => (
        <rect key={i} x={arm.x} y={arm.y} width={arm.w} height={arm.h} fill={colour} />
      ))}
      {dot ? <circle cx={mid} cy={mid} r={thickness / 2} fill={colour} stroke={outline ? 'rgba(0,0,0,0.85)' : 'none'} /> : null}
    </svg>
  );
}

export function CrosshairPanel({
  copy,
  crosshair,
  onChange,
}: {
  copy: Copy;
  crosshair: Crosshair;
  onChange: (crosshair: Crosshair) => void;
}) {
  return (
    <section className="ar-card">
      <p className="ar-eyebrow">{copy.crossTitle}</p>
      <p className="ar-muted">{copy.crossSub}</p>

      <div className="ar-cross-layout">
        <div className="ar-cross-stage">
          <CrosshairPreview crosshair={crosshair} />
          <span className="ar-tiny ar-muted">{copy.preview}</span>
        </div>

        <div className="ar-cross-controls">
          <div className="ar-swatches">
            <span className="ar-field-label">{copy.colour}</span>
            <div>
              {SWATCHES.map((swatch) => (
                <button
                  type="button"
                  key={swatch}
                  className={crosshair.colour === swatch ? 'ar-swatch ar-swatch-on' : 'ar-swatch'}
                  style={{ background: swatch }}
                  aria-label={swatch}
                  aria-pressed={crosshair.colour === swatch}
                  onClick={() => onChange({ ...crosshair, colour: swatch })}
                />
              ))}
            </div>
          </div>
          <RangeField
            label={copy.thickness}
            value={crosshair.thickness}
            min={1}
            max={6}
            step={1}
            onChange={(thickness) => onChange({ ...crosshair, thickness })}
          />
          <RangeField
            label={copy.gap}
            value={crosshair.gap}
            min={0}
            max={20}
            step={1}
            onChange={(gap) => onChange({ ...crosshair, gap })}
          />
          <RangeField
            label={copy.length}
            value={crosshair.length}
            min={0}
            max={24}
            step={1}
            onChange={(length) => onChange({ ...crosshair, length })}
          />
          <div className="ar-checks">
            <label className="ar-check">
              <input
                type="checkbox"
                checked={crosshair.dot}
                onChange={(event) => onChange({ ...crosshair, dot: event.target.checked })}
              />
              <span>{copy.centreDot}</span>
            </label>
            <label className="ar-check">
              <input
                type="checkbox"
                checked={crosshair.outline}
                onChange={(event) => onChange({ ...crosshair, outline: event.target.checked })}
              />
              <span>{copy.outline}</span>
            </label>
            <button type="button" className="ar-btn ar-btn-ghost" onClick={() => onChange({ ...DEFAULT_CROSSHAIR })}>
              {copy.reset}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---- history ----------------------------------------------------------- */

export function HistoryPanel({
  copy,
  lang,
  vault,
  onClear,
}: {
  copy: Copy;
  lang: Lang;
  vault: Vault;
  onClear: () => void;
}) {
  return (
    <section className="ar-card">
      <p className="ar-eyebrow">{copy.historyTitle}</p>
      <p className="ar-muted">{copy.historySub}</p>

      {vault.history.length === 0 ? (
        <p className="ar-empty">{copy.noHistory}</p>
      ) : (
        <>
          <div className="ar-table-wrap">
            <table className="ar-table">
              <thead>
                <tr>
                  <th scope="col">{copy.tabs.drills}</th>
                  <th scope="col">{copy.score}</th>
                  <th scope="col">{copy.accuracy}</th>
                  <th scope="col">{copy.kps}</th>
                  <th scope="col">{copy.avgTtk}</th>
                  <th scope="col">{copy.duration}</th>
                </tr>
              </thead>
              <tbody>
                {vault.history.slice(0, 12).map((run, i) => (
                  <tr key={`${run.startedAt}-${i}`}>
                    <th scope="row">{copy.scenarios[run.scenario].name}</th>
                    <td>{num(lang, run.score, 0)}</td>
                    <td>{pct(lang, run.accuracy)}</td>
                    <td>{num(lang, run.kps, 2)}</td>
                    <td>{run.avgTtk ? `${num(lang, run.avgTtk, 0)} ms` : '—'}</td>
                    <td>
                      {num(lang, run.config.duration, 0)}
                      {copy.seconds}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className="ar-btn ar-btn-ghost" onClick={onClear}>
            {copy.clearHistory}
          </button>
        </>
      )}
    </section>
  );
}

/* ---- results ----------------------------------------------------------- */

export function ResultScreen({
  copy,
  lang,
  result,
  vault,
  onAgain,
  onMenu,
}: {
  copy: Copy;
  lang: Lang;
  result: RunResult;
  vault: Vault;
  onAgain: () => void;
  onMenu: () => void;
}) {
  const best = personalBest(vault, result.scenario);
  const average = recentAverage(vault, result.scenario, 5);
  const isPb = !best || result.score >= best.score;
  const mode = result.mode;

  const rows = [
    { label: copy.thisRun, value: result.score, accent: true },
    { label: copy.pb, value: best?.score ?? result.score },
    { label: copy.avg5, value: average || result.score },
  ];

  return (
    <div className="ar-result">
      <header className="ar-result-head">
        <div>
          <p className="ar-eyebrow">{copy.resultTitle}</p>
          <h2>{copy.scenarios[result.scenario].name}</h2>
          {isPb ? <span className="ar-badge">{copy.newPb}</span> : null}
        </div>
        <div className="ar-result-actions">
          <button type="button" className="ar-btn ar-btn-ghost" onClick={onMenu}>
            {copy.toMenu}
          </button>
          <button type="button" className="ar-btn ar-btn-hot" onClick={onAgain}>
            {copy.again}
          </button>
        </div>
      </header>

      <div className="ar-stats ar-stats-6">
        <Stat label={copy.score} value={num(lang, result.score, 0)} />
        <Stat label={copy.accuracy} value={pct(lang, result.accuracy)} sub={`${result.hits}/${result.shots}`} />
        <Stat label={copy.hits} value={num(lang, result.hits, 0)} />
        <Stat label={copy.misses} value={num(lang, result.misses, 0)} />
        <Stat label={copy.kills} value={num(lang, result.kills, 0)} />
        <Stat label={copy.kps} value={num(lang, result.kps, 2)} />
      </div>

      <div className="ar-stats ar-stats-6">
        <Stat label={copy.avgTtk} value={result.ttks.length ? `${num(lang, result.avgTtk, 0)} ms` : '—'} />
        <Stat label={copy.medTtk} value={result.ttks.length ? `${num(lang, result.medTtk, 0)} ms` : '—'} />
        <Stat label={copy.reaction} value={result.reactions.length ? `${num(lang, result.avgReaction, 0)} ms` : '—'} />
        <Stat label={copy.overshoot} value={result.avgOvershoot ? `${num(lang, result.avgOvershoot, 2)}°` : '—'} />
        <Stat label={copy.undershoot} value={result.avgUndershoot ? `${num(lang, result.avgUndershoot, 2)}°` : '—'} />
        <Stat
          label={copy.overshootRate}
          value={result.flickError.length ? pct(lang, result.overshootRate, 0) : '—'}
          sub={result.flickError.length ? `n=${result.flickError.length}` : undefined}
        />
        <Stat
          label={copy.onTargetPct}
          value={mode === 'track' ? pct(lang, result.onTargetPct) : '—'}
          sub={mode === 'track' ? `${num(lang, result.onTarget, 1)}s / ${num(lang, result.trackTime, 1)}s` : undefined}
        />
        <Stat
          label={copy.sprayGroup}
          value={mode === 'spray' && result.sprayGroup ? `${num(lang, result.sprayGroup, 2)} r` : '—'}
        />
      </div>

      <div className="ar-charts">
        <section className="ar-card">
          <p className="ar-eyebrow">{copy.scatterTitle}</p>
          <p className="ar-muted ar-tiny">{copy.scatterSub}</p>
          {result.shotSamples.length ? (
            <Scatter
              shots={result.shotSamples}
              hitLabel={copy.hit}
              missLabel={copy.miss}
              radiiLabel={copy.radii}
            />
          ) : (
            <p className="ar-empty">{copy.noData}</p>
          )}
        </section>

        <section className="ar-card">
          <p className="ar-eyebrow">{copy.ttkTitle}</p>
          <p className="ar-muted ar-tiny">{copy.ttkSub}</p>
          {result.ttks.length > 1 ? <Histogram values={result.ttks} unit="ms" /> : <p className="ar-empty">{copy.noData}</p>}
        </section>

        <section className="ar-card">
          <p className="ar-eyebrow">{copy.timelineTitle}</p>
          <p className="ar-muted ar-tiny">{copy.timelineSub}</p>
          <Timeline points={result.timeline} scoreLabel={copy.score} accLabel={copy.accuracy} />
        </section>

        <section className="ar-card">
          <p className="ar-eyebrow">{copy.compareTitle}</p>
          <p className="ar-muted ar-tiny">{copy.compareSub}</p>
          <Compare rows={rows} />
        </section>
      </div>
    </div>
  );
}
