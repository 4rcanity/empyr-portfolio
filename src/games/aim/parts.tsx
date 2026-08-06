import { useId, useMemo, useRef, useState } from 'react';
import type { Crosshair, RunResult, TargetShape, TargetStyle } from './engine';
import { DEFAULT_CROSSHAIR, DEFAULT_TARGET_STYLE } from './engine';
import type { Copy, Lang } from './copy';
import { SCENARIOS, defaultConfig, LIMITS, type RunConfig, type ScenarioId, type ScoreMode } from './scenarios';
import {
  createCustomDrill,
  downloadJson,
  exportAll,
  exportDrill,
  parseImport,
  slugify,
} from './customDrills';
import { difficultyOf, estimateRank, RANKS } from './ranks';
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
import type { SensSettings, Vault, CustomDrill, AudioSettings } from './storage';
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

/** A run's stable PB/history key: the ScenarioId for builtins, or the custom
    drill's id. Falls back gracefully for runs stored before `drillKey`
    existed. */
export function drillKeyOf(run: RunResult): string {
  return run.drillKey ?? run.scenario;
}

/** Display name for a run, whether it's a builtin scenario (looked up in
    `copy`) or a custom drill (using the name snapshot taken at run time). */
export function labelFor(copy: Copy, run: RunResult): string {
  if (run.scenario === 'custom') return run.customLabel ?? copy.customDrillFallback;
  return copy.scenarios[run.scenario].name;
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

export function RangeField({
  label,
  value,
  min,
  max,
  step,
  suffix,
  disabled,
  onChange,
}: NumberFieldProps & { disabled?: boolean }) {
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
        disabled={disabled}
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
  title,
  desc,
  hint,
  mode,
  config,
  onChange,
  onStart,
  onReset,
}: {
  copy: Copy;
  id?: ScenarioId;
  title?: string;
  desc?: string;
  hint?: string;
  mode?: ScoreMode;
  config: RunConfig;
  onChange: (config: RunConfig) => void;
  onStart: () => void;
  onReset?: () => void;
}) {
  const scenario = id ? copy.scenarios[id] : null;
  const def = id ? SCENARIOS[id] : null;
  const scoreMode = mode ?? def?.mode ?? 'click';
  const trackOnly = scoreMode !== 'click';
  const heading = title ?? scenario?.name ?? copy.customDrillFallback;
  const subtitle = desc ?? scenario?.desc ?? '';
  const hintText = hint ?? scenario?.hint ?? '';
  const difficulty = difficultyOf(config, scoreMode);
  const difficultyLabel =
    difficulty.id === 'easy'
      ? copy.difficultyEasy
      : difficulty.id === 'normal'
        ? copy.difficultyNormal
        : difficulty.id === 'hard'
          ? copy.difficultyHard
          : copy.difficultyExtreme;
  const maxRankName = RANKS[difficulty.maxTierIndex]!.name;

  const reset = onReset ?? (id ? () => onChange(defaultConfig(id)) : undefined);

  return (
    <div className="ar-setup">
      <div className="ar-setup-head">
        <p className="ar-eyebrow">{copy.setup}</p>
        <h2>{heading}</h2>
        {subtitle ? <p className="ar-muted">{subtitle}</p> : null}
        {hintText ? <p className="ar-hint">{hintText}</p> : null}
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
      <RangeField
        label={copy.targetSpeed}
        value={config.speed}
        min={LIMITS.speed.min}
        max={LIMITS.speed.max}
        step={LIMITS.speed.step}
        suffix={`${copy.degrees}/s`}
        onChange={(speed) => onChange({ ...config, speed })}
      />
      <RangeField
        label={copy.directionChange}
        value={config.turnEvery}
        min={LIMITS.turnEvery.min}
        max={LIMITS.turnEvery.max}
        step={LIMITS.turnEvery.step}
        suffix={copy.seconds}
        onChange={(turnEvery) => onChange({ ...config, turnEvery })}
      />

      <div className="ar-setup-actions">
        {reset ? (
          <button type="button" className="ar-btn ar-btn-ghost" onClick={reset}>
            {copy.reset}
          </button>
        ) : null}
        <button type="button" className="ar-btn ar-btn-hot" onClick={onStart}>
          {copy.start}
        </button>
      </div>
      <p className="ar-tiny ar-muted">
        {copy.difficulty}: {difficultyLabel} · {copy.difficultyCap.replace('{name}', maxRankName)}
      </p>
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

/* ---- audio ------------------------------------------------------------- */

export function AudioPanel({
  copy,
  audio,
  onChange,
}: {
  copy: Copy;
  audio: AudioSettings;
  onChange: (audio: AudioSettings) => void;
}) {
  const volumePct = Math.round(audio.volume * 100);
  return (
    <section className="ar-card ar-audio">
      <p className="ar-eyebrow">{copy.audioTitle}</p>
      <p className="ar-muted">{copy.audioSub}</p>
      <label className="ar-check">
        <input
          type="checkbox"
          checked={audio.enabled}
          onChange={(event) => onChange({ ...audio, enabled: event.target.checked })}
        />
        <span>{copy.soundEnabled}</span>
      </label>
      <RangeField
        label={copy.volume}
        value={volumePct}
        min={0}
        max={100}
        step={5}
        suffix="%"
        disabled={!audio.enabled}
        onChange={(value) => onChange({ ...audio, volume: value / 100 })}
      />
    </section>
  );
}

export function CrosshairPanel({
  copy,
  crosshair,
  onChange,
  audio,
  onAudioChange,
}: {
  copy: Copy;
  crosshair: Crosshair;
  onChange: (crosshair: Crosshair) => void;
  audio?: AudioSettings;
  onAudioChange?: (audio: AudioSettings) => void;
}) {
  return (
    <div className="ar-panel-stack">
      {audio && onAudioChange ? <AudioPanel copy={copy} audio={audio} onChange={onAudioChange} /> : null}
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
    </div>
  );
}

/* ---- target ------------------------------------------------------------ */

const TARGET_SWATCHES = ['#ff4655', '#ff8c42', '#ffe94d', '#29c46a', '#ffffff', '#b15fde'];

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function styleFromHex(hex: string): Pick<TargetStyle, 'fill' | 'outlineColour' | 'dimFill' | 'dimOutline'> {
  return {
    fill: hexToRgba(hex, 0.9),
    outlineColour: hexToRgba(hex, 0.95),
    dimFill: 'rgba(120,140,160,0.16)',
    dimOutline: 'rgba(150,170,190,0.35)',
  };
}

function fillHex(style: TargetStyle): string {
  const match = style.fill.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return '#ff4655';
  const r = Number(match[1]).toString(16).padStart(2, '0');
  const g = Number(match[2]).toString(16).padStart(2, '0');
  const b = Number(match[3]).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

function TargetShapePreview({ style, size = 120 }: { style: TargetStyle; size?: number }) {
  const mid = size / 2;
  const r = size * 0.28;
  const path = (() => {
    switch (style.shape) {
      case 'square':
        return <rect x={mid - r * 1.15} y={mid - r * 1.15} width={r * 2.3} height={r * 2.3} />;
      case 'diamond':
        return <polygon points={`${mid},${mid - r * 1.2} ${mid + r * 1.2},${mid} ${mid},${mid + r * 1.2} ${mid - r * 1.2},${mid}`} />;
      case 'hexagon': {
        const pts = Array.from({ length: 6 }, (_, i) => {
          const angle = (Math.PI / 3) * i - Math.PI / 2;
          return `${mid + r * Math.cos(angle)},${mid + r * Math.sin(angle)}`;
        }).join(' ');
        return <polygon points={pts} />;
      }
      case 'circle':
      default:
        return <circle cx={mid} cy={mid} r={r} />;
    }
  })();
  return (
    <svg className="ar-target-preview" viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
      <rect width={size} height={size} fill="#151b21" />
      <g fill={style.fill} stroke={style.outline ? style.outlineColour : 'none'} strokeWidth={2}>
        {path}
      </g>
    </svg>
  );
}

const SHAPE_OPTIONS: { id: TargetShape; label: (copy: Copy) => string }[] = [
  { id: 'circle', label: (c) => c.shapeCircle },
  { id: 'square', label: (c) => c.shapeSquare },
  { id: 'diamond', label: (c) => c.shapeDiamond },
  { id: 'hexagon', label: (c) => c.shapeHexagon },
];

export function TargetPanel({
  copy,
  style,
  onChange,
}: {
  copy: Copy;
  style: TargetStyle;
  onChange: (style: TargetStyle) => void;
}) {
  const selectedHex = fillHex(style);
  return (
    <section className="ar-card">
      <p className="ar-eyebrow">{copy.targetTitle}</p>
      <p className="ar-muted">{copy.targetSub}</p>

      <div className="ar-cross-layout">
        <div className="ar-cross-stage">
          <TargetShapePreview style={style} />
          <span className="ar-tiny ar-muted">{copy.preview}</span>
        </div>

        <div className="ar-cross-controls">
          <div className="ar-target-shapes">
            <span className="ar-field-label">{copy.targetShape}</span>
            <div className="ar-chips">
              {SHAPE_OPTIONS.map(({ id, label }) => (
                <button
                  type="button"
                  key={id}
                  className={style.shape === id ? 'ar-chip ar-chip-on' : 'ar-chip'}
                  aria-pressed={style.shape === id}
                  onClick={() => onChange({ ...style, shape: id })}
                >
                  {label(copy)}
                </button>
              ))}
            </div>
          </div>

          <div className="ar-swatches">
            <span className="ar-field-label">{copy.colour}</span>
            <div>
              {TARGET_SWATCHES.map((swatch) => (
                <button
                  type="button"
                  key={swatch}
                  className={selectedHex.toLowerCase() === swatch ? 'ar-swatch ar-swatch-on' : 'ar-swatch'}
                  style={{ background: swatch }}
                  aria-label={swatch}
                  aria-pressed={selectedHex.toLowerCase() === swatch}
                  onClick={() => onChange({ ...style, ...styleFromHex(swatch) })}
                />
              ))}
            </div>
          </div>

          <label className="ar-check">
            <input
              type="checkbox"
              checked={style.outline}
              onChange={(event) => onChange({ ...style, outline: event.target.checked })}
            />
            <span>{copy.outline}</span>
          </label>

          <button type="button" className="ar-btn ar-btn-ghost" onClick={() => onChange({ ...DEFAULT_TARGET_STYLE })}>
            {copy.reset}
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---- custom drills ----------------------------------------------------- */

function modeLabel(copy: Copy, mode: ScoreMode): string {
  if (mode === 'click') return copy.modeClick;
  if (mode === 'track') return copy.modeTrack;
  return copy.modeSpray;
}

export function CustomDrillsSection({
  copy,
  lang,
  vault,
  drills,
  selectedId,
  onSelect,
  onChange,
}: {
  copy: Copy;
  lang: Lang;
  vault: Vault;
  drills: CustomDrill[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (drills: CustomDrill[]) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMode, setNewMode] = useState<ScoreMode>('click');
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const updateDrill = (id: string, patch: Partial<CustomDrill>) => {
    onChange(drills.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  const handleCreate = () => {
    const drill = createCustomDrill(newName || copy.customDrillFallback, newMode);
    onChange([...drills, drill]);
    onSelect(drill.id);
    setShowForm(false);
    setNewName('');
    setNewMode('click');
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseImport(JSON.parse(text));
      if (!parsed.length) {
        setImportMsg(copy.importNone);
      } else {
        onChange([...drills, ...parsed]);
        setImportMsg(copy.importedCount.replace('{n}', String(parsed.length)));
      }
    } catch {
      setImportMsg(copy.importNone);
    }
    window.setTimeout(() => setImportMsg(null), 4000);
  };

  return (
    <div className="ar-custom-section">
      <div className="ar-custom-head">
        <p className="ar-eyebrow">{copy.myDrills}</p>
        <div className="ar-custom-toolbar">
          <button type="button" className="ar-btn ar-btn-ghost ar-btn-quiet" onClick={() => setShowForm((v) => !v)}>
            {copy.newDrill}
          </button>
          <button
            type="button"
            className="ar-btn ar-btn-ghost ar-btn-quiet"
            disabled={!drills.length}
            onClick={() => downloadJson('range-07-custom-drills.json', exportAll(drills))}
          >
            {copy.exportAll}
          </button>
          <button type="button" className="ar-btn ar-btn-ghost ar-btn-quiet" onClick={() => fileRef.current?.click()}>
            {copy.importDrills}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="ar-sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleImport(file);
              event.target.value = '';
            }}
          />
        </div>
      </div>

      {importMsg ? <p className="ar-tiny ar-muted">{importMsg}</p> : null}

      {showForm ? (
        <div className="ar-custom-form">
          <input
            type="text"
            className="ar-custom-input"
            placeholder={copy.customDrillFallback}
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
          />
          <div className="ar-chips">
            {(['click', 'track', 'spray'] as ScoreMode[]).map((mode) => (
              <button
                type="button"
                key={mode}
                className={newMode === mode ? 'ar-chip ar-chip-on' : 'ar-chip'}
                aria-pressed={newMode === mode}
                onClick={() => setNewMode(mode)}
              >
                {modeLabel(copy, mode)}
              </button>
            ))}
          </div>
          <button type="button" className="ar-btn ar-btn-hot" onClick={handleCreate}>
            {copy.createDrill}
          </button>
        </div>
      ) : null}

      {drills.length === 0 ? (
        <p className="ar-empty">{copy.noCustomDrills}</p>
      ) : (
        <ul className="ar-custom-list">
          {drills.map((drill) => {
            const pb = personalBest(vault, drill.id);
            const isSelected = selectedId === drill.id;
            const isEditing = editingId === drill.id;
            return (
              <li key={drill.id} className="ar-custom-row">
                <button
                  type="button"
                  className={isSelected ? 'ar-scenario ar-scenario-on' : 'ar-scenario'}
                  aria-pressed={isSelected}
                  onClick={() => onSelect(drill.id)}
                >
                  <span className="ar-scenario-tag">{modeLabel(copy, drill.mode)}</span>
                  {isEditing ? (
                    <input
                      type="text"
                      className="ar-custom-input ar-custom-input-inline"
                      value={editName}
                      autoFocus
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => setEditName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          updateDrill(drill.id, { name: editName.trim() || drill.name });
                          setEditingId(null);
                        }
                        if (event.key === 'Escape') setEditingId(null);
                      }}
                      onBlur={() => {
                        updateDrill(drill.id, { name: editName.trim() || drill.name });
                        setEditingId(null);
                      }}
                    />
                  ) : (
                    <strong>{drill.name}</strong>
                  )}
                  <span className="ar-scenario-pb">
                    {copy.pb}: {pb ? num(lang, pb.score, 0) : '—'}
                  </span>
                </button>
                <div className="ar-custom-actions">
                  <button
                    type="button"
                    className="ar-btn ar-btn-quiet"
                    onClick={() => {
                      setEditingId(drill.id);
                      setEditName(drill.name);
                    }}
                  >
                    {copy.rename}
                  </button>
                  <button
                    type="button"
                    className="ar-btn ar-btn-quiet"
                    onClick={() => {
                      const clone = createCustomDrill(`${drill.name} (copy)`, drill.mode);
                      onChange([...drills, { ...clone, config: { ...drill.config } }]);
                      onSelect(clone.id);
                    }}
                  >
                    {copy.duplicate}
                  </button>
                  <button
                    type="button"
                    className="ar-btn ar-btn-quiet"
                    onClick={() => downloadJson(`${slugify(drill.name)}.json`, exportDrill(drill))}
                  >
                    {copy.exportDrill}
                  </button>
                  <button
                    type="button"
                    className="ar-btn ar-btn-quiet"
                    onClick={() => {
                      if (confirmDeleteId !== drill.id) {
                        setConfirmDeleteId(drill.id);
                        window.setTimeout(() => setConfirmDeleteId((id) => (id === drill.id ? null : id)), 3000);
                        return;
                      }
                      onChange(drills.filter((d) => d.id !== drill.id));
                      if (selectedId === drill.id) onSelect(null);
                      setConfirmDeleteId(null);
                    }}
                  >
                    {confirmDeleteId === drill.id ? copy.confirmDelete : copy.deleteDrill}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
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
                    <th scope="row">{labelFor(copy, run)}</th>
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

const RANK_SUB = ['I', 'II', 'III'] as const;

export function RankBadge({ copy, lang, result }: { copy: Copy; lang: Lang; result: RunResult }) {
  const rank = useMemo(() => estimateRank(result), [result]);
  const suffix = rank.tierIndex === 8 ? '' : ` ${RANK_SUB[rank.sub - 1]}`;

  const difficultyLabel =
    rank.difficulty.id === 'easy'
      ? copy.difficultyEasy
      : rank.difficulty.id === 'normal'
        ? copy.difficultyNormal
        : rank.difficulty.id === 'hard'
          ? copy.difficultyHard
          : copy.difficultyExtreme;

  const maxName = RANKS[rank.difficulty.maxTierIndex]!.name;
  const capLine = copy.difficultyCap.replace('{name}', maxName);

  const toNextFormatted =
    result.mode === 'track' ? pct(lang, rank.toNext, 0) : num(lang, rank.toNext, 0);

  const progressText = rank.nextTier
    ? copy.rankToNext.replace('{n}', toNextFormatted).replace('{name}', rank.nextTier.name)
    : copy.rankMaxed;

  return (
    <div className="ar-rank-block">
      <p className="ar-tiny ar-muted">{copy.rankTitle}</p>
      <span
        className="ar-rank-badge"
        style={{
          color: rank.tier.color,
          borderColor: rank.tier.color,
          background: `${rank.tier.color}22`,
        }}
      >
        {rank.tier.name}
        {suffix}
      </span>
      <p className="ar-tiny ar-muted">
        {copy.difficulty}: {difficultyLabel} · {capLine}
      </p>
      <p className="ar-tiny ar-muted">{rank.capped ? copy.rankCapped : progressText}</p>
      <p className="ar-tiny ar-muted">{copy.rankDisclaimer}</p>
    </div>
  );
}

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
  const key = drillKeyOf(result);
  const best = personalBest(vault, key);
  const average = recentAverage(vault, key, 5);
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
          <h2>{labelFor(copy, result)}</h2>
          <div className="ar-result-badges">
            {isPb ? <span className="ar-badge">{copy.newPb}</span> : null}
            <RankBadge copy={copy} lang={lang} result={result} />
          </div>
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
