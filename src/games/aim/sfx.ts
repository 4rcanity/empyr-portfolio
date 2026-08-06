/* Tiny WebAudio synth — no samples, no dependencies. Every play() respects
   the module-level enabled/volume state and fails silently when audio is
   unavailable (SSR, blocked context, user mute). */

export type SfxType = 'shot' | 'hit' | 'miss' | 'kill' | 'pb' | 'countdown';

let ctx: AudioContext | null = null;
let enabled = true;
let volume = 0.6;

/** Continuous M1-hold voice (tracking beam / spray sustain). */
let holdGain: GainNode | null = null;
let holdOscA: OscillatorNode | null = null;
let holdOscB: OscillatorNode | null = null;
let holdNoise: AudioBufferSourceNode | null = null;
let holding = false;

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
  if (!value) stopHold();
}

export function setVolume(value: number): void {
  volume = Math.max(0, Math.min(1, value));
  if (holdGain && ctx) {
    try {
      holdGain.gain.setTargetAtTime(holding ? 0.045 * volume : 0.0001, ctx.currentTime, 0.02);
    } catch {
      /* no-op */
    }
  }
}

function tone(
  frequency: number,
  duration: number,
  type: OscillatorType,
  gainPeak: number,
  when = 0,
  slideTo?: number,
): void {
  if (!ctx || !enabled || volume <= 0) return;
  try {
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, t0);
    if (slideTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + duration);
    }
    const peak = gainPeak * volume;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), t0 + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  } catch {
    /* no-op */
  }
}

/** Short noise burst — used for the M1 mechanical click. */
function noiseBurst(duration: number, gainPeak: number, when = 0, highpass = 800): void {
  if (!ctx || !enabled || volume <= 0) return;
  try {
    const t0 = ctx.currentTime + when;
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = highpass;
    const gain = ctx.createGain();
    const peak = gainPeak * volume;
    gain.gain.setValueAtTime(peak, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(t0);
    src.stop(t0 + duration + 0.01);
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
      // M1: dry mechanical click + soft body tick — short so spray doesn't mush.
      noiseBurst(0.022, 0.11, 0, 1200);
      tone(220, 0.028, 'square', 0.05, 0, 90);
      break;
    case 'hit':
      // Target strike: bright ping.
      tone(1480, 0.045, 'sine', 0.14);
      tone(2200, 0.03, 'triangle', 0.06, 0.01);
      break;
    case 'kill':
      // Confirmation on a destroy (click drills) — layered after hit.
      tone(660, 0.04, 'triangle', 0.08);
      tone(990, 0.07, 'sine', 0.1, 0.03);
      break;
    case 'miss':
      // Soft thud / dead click — clearly not a hit.
      noiseBurst(0.04, 0.07, 0, 200);
      tone(110, 0.07, 'triangle', 0.08, 0, 55);
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

/** Start the sustained M1-hold voice (tracking beam / spray sustain). Safe to
    call repeatedly — restarts only when not already holding. */
export function startHold(): void {
  if (!enabled || volume <= 0) return;
  initAudio();
  if (!ctx || holding) return;
  try {
    if (ctx.state === 'suspended') void ctx.resume();

    const t0 = ctx.currentTime;
    holdGain = ctx.createGain();
    holdGain.gain.setValueAtTime(0.0001, t0);
    holdGain.gain.exponentialRampToValueAtTime(0.045 * volume, t0 + 0.04);
    holdGain.connect(ctx.destination);

    // Low body hum.
    holdOscA = ctx.createOscillator();
    holdOscA.type = 'sawtooth';
    holdOscA.frequency.value = 72;
    const bodyFilter = ctx.createBiquadFilter();
    bodyFilter.type = 'lowpass';
    bodyFilter.frequency.value = 280;
    const bodyGain = ctx.createGain();
    bodyGain.gain.value = 0.55;
    holdOscA.connect(bodyFilter);
    bodyFilter.connect(bodyGain);
    bodyGain.connect(holdGain);
    holdOscA.start(t0);

    // Higher hiss edge so it reads as "firing", not just a drone.
    holdOscB = ctx.createOscillator();
    holdOscB.type = 'square';
    holdOscB.frequency.value = 180;
    const edgeGain = ctx.createGain();
    edgeGain.gain.value = 0.12;
    holdOscB.connect(edgeGain);
    edgeGain.connect(holdGain);
    holdOscB.start(t0);

    // Soft noise bed.
    const length = Math.max(1, Math.floor(ctx.sampleRate * 0.25));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    holdNoise = ctx.createBufferSource();
    holdNoise.buffer = buffer;
    holdNoise.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1800;
    noiseFilter.Q.value = 0.7;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.2;
    holdNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(holdGain);
    holdNoise.start(t0);

    holding = true;
  } catch {
    stopHold();
  }
}

export function stopHold(): void {
  if (!holding && !holdGain) return;
  const audio = ctx;
  const gain = holdGain;
  const a = holdOscA;
  const b = holdOscB;
  const noise = holdNoise;
  holdGain = null;
  holdOscA = null;
  holdOscB = null;
  holdNoise = null;
  holding = false;
  if (!audio || !gain) return;
  try {
    const t0 = audio.currentTime;
    gain.gain.cancelScheduledValues(t0);
    gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
    const stopAt = t0 + 0.07;
    a?.stop(stopAt);
    b?.stop(stopAt);
    noise?.stop(stopAt);
    window.setTimeout(() => {
      try {
        gain.disconnect();
      } catch {
        /* no-op */
      }
    }, 90);
  } catch {
    try {
      a?.stop();
      b?.stop();
      noise?.stop();
      gain.disconnect();
    } catch {
      /* no-op */
    }
  }
}
