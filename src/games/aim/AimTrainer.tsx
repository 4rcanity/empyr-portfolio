import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './aim.css';
import { AimEngine, type EngineSens, type LiveStats, type RunResult } from './engine';
import { copyFor, type Lang } from './copy';
import { SCENARIOS, SCENARIO_ORDER, clampConfig, defaultConfig, type RunConfig, type ScenarioId } from './scenarios';
import { profileOf } from './sens';
import * as sfx from './sfx';
import { defaultConfigForMode } from './customDrills';
import {
  configFor,
  emptyVault,
  findCustomDrill,
  loadVault,
  personalBest,
  saveVault,
  type SensSettings,
  type Vault,
} from './storage';
import {
  CrosshairPanel,
  CustomDrillsSection,
  HistoryPanel,
  ResultScreen,
  SensPanel,
  SetupPanel,
  TargetPanel,
  drillKeyOf,
  num,
  pct,
} from './parts';

type Phase = 'menu' | 'arming' | 'live' | 'paused' | 'lockfail' | 'result';
type Tab = 'drills' | 'sens' | 'crosshair' | 'target' | 'history';

const EMPTY_STATS: LiveStats = {
  elapsed: 0,
  remaining: 0,
  score: 0,
  hits: 0,
  misses: 0,
  shots: 0,
  accuracy: 0,
  kills: 0,
  onTarget: 0,
  ammo: 0,
  running: false,
};

interface PointerLockOpts {
  unadjustedMovement?: boolean;
}

export default function AimTrainer({ lang }: { lang: Lang }) {
  const copy = useMemo(() => copyFor(lang), [lang]);

  const [vault, setVault] = useState<Vault>(() => emptyVault());
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window === 'undefined') return 'drills';
    const wanted = new URLSearchParams(window.location.search).get('tab');
    return wanted === 'sens' || wanted === 'crosshair' || wanted === 'target' || wanted === 'history' ? wanted : 'drills';
  });
  const [scenario, setScenario] = useState<ScenarioId>('gridshot');
  const [customDrillId, setCustomDrillId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('menu');
  const [cursorMode, setCursorMode] = useState(false);
  const [stats, setStats] = useState<LiveStats>(EMPTY_STATS);
  const [result, setResult] = useState<RunResult | null>(null);

  const engineRef = useRef<AimEngine | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const phaseRef = useRef<Phase>('menu');
  const cursorRef = useRef(false);
  const finishRef = useRef<() => void>(() => {});
  // Set the instant a run ends, synchronously — before exitPointerLock() is
  // even called. The browser fires pointerlockchange asynchronously, and its
  // timing relative to React's commit is not guaranteed, so the phase alone
  // is not a reliable guard: a stale 'live' read in that handler would flip
  // a finished run's 'result' phase back to 'paused'. This ref can't race.
  const endedRef = useRef(false);
  const holdModeRef = useRef(false);

  phaseRef.current = phase;
  cursorRef.current = cursorMode;

  if (engineRef.current === null) {
    engineRef.current = new AimEngine();
    engineRef.current.onEvent = (type) => {
      if (type === 'fireStart') {
        if (holdModeRef.current) sfx.startHold();
        return;
      }
      if (type === 'fireStop') {
        sfx.stopHold();
        return;
      }
      sfx.play(type);
    };
  }
  const engine = engineRef.current;

  const activeCustomDrill = useMemo(
    () => (customDrillId ? findCustomDrill(vault, customDrillId) : null),
    [vault, customDrillId],
  );

  useEffect(() => {
    const stored = loadVault();
    setVault(stored);
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveVault(vault);
  }, [vault, ready]);

  useEffect(() => {
    sfx.setEnabled(vault.audio.enabled);
    sfx.setVolume(vault.audio.volume);
  }, [vault.audio]);

  const config = useMemo(() => {
    if (activeCustomDrill) return clampConfig(activeCustomDrill.config);
    return configFor(vault, scenario);
  }, [vault, scenario, activeCustomDrill]);

  const engineSens: EngineSens = useMemo(() => {
    const profile = profileOf(vault.sens.source);
    return {
      yaw: profile.yaw,
      sens: vault.sens.sens,
      dpi: vault.sens.dpi,
      fov: vault.sens.fov,
      invertY: vault.sens.invertY,
    };
  }, [vault.sens]);

  useEffect(() => {
    engine.setSens(engineSens);
  }, [engine, engineSens]);

  useEffect(() => {
    engine.setCrosshair(vault.crosshair);
  }, [engine, vault.crosshair]);

  useEffect(() => {
    engine.setTargetStyle(vault.targetStyle);
  }, [engine, vault.targetStyle]);

  const activeCustomRef = useRef(activeCustomDrill);
  activeCustomRef.current = activeCustomDrill;

  /* ---- canvas sizing --------------------------------------------------- */

  const sizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const rect = stage.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    engine.resize(width, height, dpr);
    engine.render();
  }, [engine]);

  useEffect(() => {
    if (phase === 'menu') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    engine.attach(canvas);
    sizeCanvas();
    const observer = new ResizeObserver(sizeCanvas);
    if (stageRef.current) observer.observe(stageRef.current);
    window.addEventListener('resize', sizeCanvas);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', sizeCanvas);
    };
  }, [engine, phase, sizeCanvas]);

  /* ---- run lifecycle --------------------------------------------------- */

  const finish = useCallback(() => {
    endedRef.current = true;
    sfx.stopHold();
    engine.stop();
    const raw = engine.result();
    const custom = activeCustomRef.current;
    const run: RunResult = custom
      ? { ...raw, drillKey: custom.id, customLabel: custom.name }
      : raw;
    const key = drillKeyOf(run);
    const prevBest = personalBest(vault, key);
    const isNewPb = !prevBest || run.score > prevBest.score;
    if (isNewPb) sfx.play('pb');
    setResult(run);
    setVault((current) => ({ ...current, history: [run, ...current.history] }));
    setPhase('result');
    if (typeof document !== 'undefined' && document.pointerLockElement) document.exitPointerLock();
  }, [engine, vault]);

  finishRef.current = finish;

  const beginRun = useCallback(() => {
    const custom = activeCustomRef.current;
    if (custom) {
      holdModeRef.current = custom.mode === 'track' || custom.mode === 'spray';
      engine.start('custom', custom.config, engineSens, undefined, custom.mode);
    } else {
      const mode = SCENARIOS[scenario].mode;
      holdModeRef.current = mode === 'track' || mode === 'spray';
      engine.start(scenario, config, engineSens);
    }
    setStats(engine.stats());
  }, [config, engine, engineSens, scenario]);

  const arm = useCallback(() => {
    endedRef.current = false;
    setResult(null);
    setPhase('arming');
  }, []);

  const requestLock = useCallback(() => {
    sfx.initAudio();
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (cursorRef.current) {
      if (!engine.running) beginRun();
      setPhase('live');
      return;
    }
    if (typeof canvas.requestPointerLock !== 'function') {
      setPhase('lockfail');
      return;
    }
    let request: unknown;
    try {
      request = (canvas.requestPointerLock as (options?: PointerLockOpts) => unknown)({
        unadjustedMovement: true,
      });
    } catch {
      request = undefined;
    }
    if (request && typeof (request as Promise<void>).catch === 'function') {
      (request as Promise<void>).catch(() => {
        // Raw input refused by the platform — try again without it.
        try {
          const retry = canvas.requestPointerLock() as unknown;
          if (retry && typeof (retry as Promise<void>).catch === 'function') {
            (retry as Promise<void>).catch(() => setPhase('lockfail'));
          }
        } catch {
          setPhase('lockfail');
        }
      });
    }
  }, [beginRun, engine]);

  const quit = useCallback(() => {
    if (engine.running || engine.stats().shots > 0 || engine.stats().elapsed > 0) finish();
    else {
      engine.stop();
      setPhase('menu');
    }
  }, [engine, finish]);

  const backToMenu = useCallback(() => {
    endedRef.current = false;
    engine.stop();
    setResult(null);
    setPhase('menu');
    if (typeof document !== 'undefined' && document.pointerLockElement) document.exitPointerLock();
  }, [engine]);

  /* ---- pointer lock ---------------------------------------------------- */

  useEffect(() => {
    const onChange = () => {
      const locked = document.pointerLockElement === canvasRef.current;
      if (locked) {
        if (!engine.running) beginRun();
        setPhase('live');
      } else if (phaseRef.current === 'live' && !endedRef.current) {
        setPhase('paused');
      }
    };
    const onError = () => {
      if (phaseRef.current === 'arming' || phaseRef.current === 'paused') setPhase('lockfail');
    };
    document.addEventListener('pointerlockchange', onChange);
    document.addEventListener('pointerlockerror', onError);
    return () => {
      document.removeEventListener('pointerlockchange', onChange);
      document.removeEventListener('pointerlockerror', onError);
    };
  }, [beginRun, engine]);

  // A tab-out drops the lock silently; make sure the drill parks itself.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden' && phaseRef.current === 'live' && !endedRef.current) {
        setPhase('paused');
      }
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('blur', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('blur', onHide);
    };
  }, []);

  /* ---- input ----------------------------------------------------------- */

  useEffect(() => {
    if (phase !== 'live') return;
    const onMove = (event: MouseEvent) => {
      if (cursorRef.current) engine.look(event.movementX, event.movementY);
      else if (document.pointerLockElement === canvasRef.current) {
        engine.look(event.movementX, event.movementY);
      }
    };
    const onDown = (event: MouseEvent) => {
      if (event.button !== 0) return;
      // In cursor mode the HUD is still clickable — quitting must not fire a shot.
      const target = event.target as HTMLElement | null;
      if (target?.closest?.('.ar-hud')) return;
      event.preventDefault();
      engine.down();
    };
    const onUp = (event: MouseEvent) => {
      if (event.button !== 0) return;
      engine.up();
    };
    const onContext = (event: Event) => event.preventDefault();
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('contextmenu', onContext);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('contextmenu', onContext);
      engine.up();
    };
  }, [engine, phase]);

  /* ---- loop ------------------------------------------------------------ */

  useEffect(() => {
    if (phase !== 'live') {
      if (phase === 'paused') engine.render();
      return;
    }
    lastRef.current = performance.now();
    const frame = (now: number) => {
      // Clamp the frame delta here, not in the engine: a stalled tab must not
      // teleport the simulation, but a deliberate long step should still run.
      const dt = Math.min(100, now - lastRef.current);
      lastRef.current = now;
      engine.update(dt);
      engine.render();
      if (!engine.running) {
        finishRef.current();
        return;
      }
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [engine, phase]);

  useEffect(() => {
    if (phase !== 'live') return;
    const id = window.setInterval(() => setStats(engine.stats()), 100);
    return () => window.clearInterval(id);
  }, [engine, phase]);

  /* ---- headless test hook ---------------------------------------------- */

  useEffect(() => {
    const hook = {
      /* Headless start: no rAF, no pointer lock, fixed viewport. The drill is
         driven entirely by explicit tick/look/down calls so a test can assert
         exact numbers. Call `show()` afterwards to render it on screen. */
      begin: (id: ScenarioId, overrides: Partial<RunConfig> = {}, seed = 1) => {
        setScenario(id);
        const merged = clampConfig({ ...defaultConfig(id), ...overrides });
        engine.resize(1200, 700, 1);
        engine.start(id, merged, engineSens, seed);
        return engine.stats();
      },
      show: () => setPhase('live'),
      look: (dx: number, dy: number) => engine.look(dx, dy),
      snap: (index = -1, offsetYaw = 0, offsetPitch = 0) => engine.snapTo(index, offsetYaw, offsetPitch),
      down: () => engine.down(),
      up: () => engine.up(),
      tick: (ms: number) => engine.update(ms),
      targets: () => engine.targets(),
      camera: () => engine.camera(),
      stats: () => engine.stats(),
      finish: () => {
        finishRef.current();
        return engine.result();
      },
      beginCustom: (mode: 'click' | 'track' | 'spray', overrides: Partial<RunConfig> = {}, seed = 1) => {
        const merged = clampConfig({ ...defaultConfigForMode(mode), ...overrides });
        engine.resize(1200, 700, 1);
        engine.start('custom', merged, engineSens, seed, mode);
        return engine.stats();
      },
      sens: () => engineSens,
    };
    (window as unknown as Record<string, unknown>).__aim = hook;
    return () => {
      delete (window as unknown as Record<string, unknown>).__aim;
    };
  }, [engine, engineSens]);

  /* ---- render ---------------------------------------------------------- */

  const scenarioCopy = activeCustomDrill
    ? {
        name: activeCustomDrill.name,
        hint:
          activeCustomDrill.mode === 'track'
            ? copy.scenarios.tracking.hint
            : activeCustomDrill.mode === 'spray'
              ? copy.scenarios.spray.hint
              : copy.scenarios.gridshot.hint,
      }
    : copy.scenarios[scenario];
  const playMode = activeCustomDrill?.mode ?? SCENARIOS[scenario].mode;
  const drillKey = activeCustomDrill?.id ?? scenario;
  const best = ready ? personalBest(vault, drillKey) : null;

  const updateConfig = useCallback(
    (next: RunConfig) => {
      const clamped = clampConfig(next);
      if (activeCustomDrill) {
        setVault((current) => ({
          ...current,
          customDrills: current.customDrills.map((d) =>
            d.id === activeCustomDrill.id ? { ...d, config: clamped } : d,
          ),
        }));
      } else {
        setVault((current) => ({
          ...current,
          configs: { ...current.configs, [scenario]: clamped },
        }));
      }
    },
    [activeCustomDrill, scenario],
  );

  if (phase === 'result' && result) {
    return (
      <div className="ar">
        <Chrome copy={copy} lang={lang} onBack={backToMenu} />
        <main className="ar-main">
          <ResultScreen
            copy={copy}
            lang={lang}
            result={result}
            vault={vault}
            onAgain={arm}
            onMenu={backToMenu}
          />
        </main>
      </div>
    );
  }

  if (phase !== 'menu') {
    const seconds = stats.remaining / 1000;
    return (
      <div className="ar ar-playing">
        <div className="ar-hud">
          <span className="ar-hud-name">{scenarioCopy.name}</span>
          <HudCell label={copy.hudTime} value={num(lang, Math.max(0, seconds), 1)} />
          <HudCell label={copy.hudScore} value={num(lang, stats.score, 0)} />
          <HudCell label={copy.hudAcc} value={pct(lang, stats.accuracy, 0)} />
          <HudCell label={copy.hudHits} value={`${stats.hits}/${stats.shots}`} />
          {playMode === 'track' ? <HudCell label={copy.hudOnTarget} value={pct(lang, stats.onTarget, 0)} /> : null}
          {playMode === 'spray' ? <HudCell label={copy.hudAmmo} value={`${stats.ammo}`} /> : null}
          {cursorMode ? <span className="ar-hud-badge">{copy.fallbackBadge}</span> : null}
          <button type="button" className="ar-btn ar-btn-quiet" onClick={quit}>
            {copy.quit}
          </button>
        </div>

        <div className="ar-stage" ref={stageRef}>
          <canvas ref={canvasRef} className="ar-canvas" />

          {phase === 'arming' ? (
            <Overlay
              title={copy.armTitle}
              body={copy.armSub}
              primary={copy.armButton}
              onPrimary={requestLock}
              secondary={copy.armFallback}
              onSecondary={() => {
                sfx.initAudio();
                setCursorMode(true);
                cursorRef.current = true;
                if (!engine.running) beginRun();
                setPhase('live');
              }}
              tertiary={copy.quit}
              onTertiary={backToMenu}
              hint={scenarioCopy.hint}
            />
          ) : null}

          {phase === 'paused' ? (
            <Overlay
              title={copy.lockLostTitle}
              body={copy.lockLostSub}
              primary={copy.resume}
              onPrimary={requestLock}
              tertiary={copy.quit}
              onTertiary={quit}
              hint={scenarioCopy.hint}
            />
          ) : null}

          {phase === 'lockfail' ? (
            <Overlay
              title={copy.lockFailTitle}
              body={copy.lockFailSub}
              primary={copy.fallbackOn}
              onPrimary={() => {
                sfx.initAudio();
                setCursorMode(true);
                cursorRef.current = true;
                if (!engine.running) beginRun();
                setPhase('live');
              }}
              secondary={copy.armButton}
              onSecondary={requestLock}
              tertiary={copy.quit}
              onTertiary={quit}
            />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="ar">
      <Chrome copy={copy} lang={lang} />
      <main className="ar-main">
        <nav className="ar-tabs" aria-label={copy.tabs.drills}>
          {(['drills', 'sens', 'crosshair', 'target', 'history'] as Tab[]).map((key) => (
            <button
              type="button"
              key={key}
              className={tab === key ? 'ar-tab ar-tab-on' : 'ar-tab'}
              aria-current={tab === key}
              onClick={() => setTab(key)}
            >
              {copy.tabs[key]}
            </button>
          ))}
        </nav>

        {tab === 'drills' ? (
          <div className="ar-drills">
            <div className="ar-drills-list">
              <ul className="ar-scenarios">
                {SCENARIO_ORDER.map((id) => {
                  const item = copy.scenarios[id];
                  const pb = ready ? personalBest(vault, id) : null;
                  const isOn = !activeCustomDrill && id === scenario;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        className={isOn ? 'ar-scenario ar-scenario-on' : 'ar-scenario'}
                        aria-pressed={isOn}
                        onClick={() => {
                          setScenario(id);
                          setCustomDrillId(null);
                        }}
                      >
                        <span className="ar-scenario-tag">{item.tag}</span>
                        <strong>{item.name}</strong>
                        <span className="ar-scenario-desc">{item.desc}</span>
                        <span className="ar-scenario-pb">
                          {copy.pb}: {pb ? num(lang, pb.score, 0) : '—'}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <CustomDrillsSection
                copy={copy}
                lang={lang}
                vault={vault}
                drills={vault.customDrills}
                selectedId={customDrillId}
                onSelect={(id) => {
                  if (id) setCustomDrillId(id);
                  else setCustomDrillId(null);
                }}
                onChange={(customDrills) => setVault((current) => ({ ...current, customDrills }))}
              />
            </div>

            <aside className="ar-card ar-sticky">
              <SetupPanel
                copy={copy}
                id={activeCustomDrill ? undefined : scenario}
                title={activeCustomDrill?.name}
                mode={activeCustomDrill?.mode}
                config={config}
                onChange={updateConfig}
                onReset={
                  activeCustomDrill
                    ? () => updateConfig(defaultConfigForMode(activeCustomDrill.mode))
                    : undefined
                }
                onStart={arm}
              />
              {best ? (
                <p className="ar-tiny ar-muted">
                  {copy.pb}: {num(lang, best.score, 0)} · {pct(lang, best.accuracy)}
                </p>
              ) : null}
            </aside>
          </div>
        ) : null}

        {tab === 'sens' ? (
          <SensPanel
            copy={copy}
            lang={lang}
            sens={vault.sens}
            onChange={(sens: SensSettings) => setVault((current) => ({ ...current, sens }))}
          />
        ) : null}

        {tab === 'crosshair' ? (
          <CrosshairPanel
            copy={copy}
            crosshair={vault.crosshair}
            audio={vault.audio}
            onAudioChange={(audio) => setVault((current) => ({ ...current, audio }))}
            onChange={(crosshair) => setVault((current) => ({ ...current, crosshair }))}
          />
        ) : null}

        {tab === 'target' ? (
          <TargetPanel
            copy={copy}
            style={vault.targetStyle}
            onChange={(targetStyle) => setVault((current) => ({ ...current, targetStyle }))}
          />
        ) : null}

        {tab === 'history' ? (
          <HistoryPanel
            copy={copy}
            lang={lang}
            vault={vault}
            onClear={() => setVault((current) => ({ ...current, history: [] }))}
          />
        ) : null}
      </main>
    </div>
  );
}

function HudCell({ label, value }: { label: string; value: string }) {
  return (
    <span className="ar-hud-cell">
      <small>{label}</small>
      <b>{value}</b>
    </span>
  );
}

function Chrome({ copy, lang, onBack }: { copy: ReturnType<typeof copyFor>; lang: Lang; onBack?: () => void }) {
  return (
    <header className="ar-chrome">
      <span className="ar-mark">{copy.brand}</span>
      <span className="ar-tagline">{copy.tagline}</span>
      <span className="ar-grow" />
      {onBack ? (
        <button type="button" className="ar-btn ar-btn-quiet" onClick={onBack}>
          {copy.back}
        </button>
      ) : (
        <a className="ar-btn ar-btn-quiet" href={`/${lang}/minigames/aim`}>
          {copy.back}
        </a>
      )}
    </header>
  );
}

interface OverlayProps {
  title: string;
  body: string;
  primary: string;
  onPrimary: () => void;
  secondary?: string;
  onSecondary?: () => void;
  tertiary?: string;
  onTertiary?: () => void;
  hint?: string;
}

function Overlay({ title, body, primary, onPrimary, secondary, onSecondary, tertiary, onTertiary, hint }: OverlayProps) {
  return (
    <div className="ar-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="ar-overlay-card">
        <h2>{title}</h2>
        <p>{body}</p>
        {hint ? <p className="ar-hint">{hint}</p> : null}
        <div className="ar-overlay-actions">
          <button type="button" className="ar-btn ar-btn-hot" onClick={onPrimary} autoFocus>
            {primary}
          </button>
          {secondary && onSecondary ? (
            <button type="button" className="ar-btn ar-btn-ghost" onClick={onSecondary}>
              {secondary}
            </button>
          ) : null}
          {tertiary && onTertiary ? (
            <button type="button" className="ar-btn ar-btn-quiet" onClick={onTertiary}>
              {tertiary}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
