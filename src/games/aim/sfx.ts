/* Tiny WebAudio synth — no samples, no dependencies. Every play() respects
   the module-level enabled/volume state and fails silently when audio is
   unavailable (SSR, blocked context, user mute). */

type SfxType = 'shot' | 'hit' | 'miss' | 'kill' | 'pb' | 'countdown';

let ctx: AudioContext | null = null;
let enabled = true;
let volume = 0.6;

export function initAudio(): void {
  if (typeof window === 'undefined') return;
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
}

export function setEnabled(value: boolean): void {
  enabled = value;
}

export function setVolume(value: number): void {
  volume = Math.max(0, Math.min(1, value));
}

function tone(
  frequency: number,
  duration: number,
  type: OscillatorType,
  gainPeak: number,
  when = 0,
): void {
  if (!ctx || !enabled || volume <= 0) return;
  try {
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, t0);
    const peak = gainPeak * volume;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), t0 + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  } catch {
    /* no-op */
  }
}

export function play(type: SfxType): void {
  if (!enabled || volume <= 0) return;
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    return;
  }

  switch (type) {
    case 'shot':
      tone(1800, 0.018, 'square', 0.04);
      break;
    case 'hit':
      tone(920, 0.06, 'sine', 0.12);
      break;
    case 'kill':
      tone(780, 0.05, 'triangle', 0.1);
      tone(1040, 0.07, 'sine', 0.11, 0.04);
      break;
    case 'miss':
      tone(140, 0.05, 'triangle', 0.06);
      break;
    case 'pb':
      tone(523, 0.07, 'sine', 0.14);
      tone(659, 0.07, 'sine', 0.14, 0.07);
      tone(784, 0.1, 'sine', 0.16, 0.14);
      break;
    case 'countdown':
      tone(660, 0.04, 'sine', 0.08);
      break;
  }
}
