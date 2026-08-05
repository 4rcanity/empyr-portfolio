/** Tiny synth for the board: clacking pawns, a rattling die, a nasty capture. */

export type Sfx = 'tap' | 'roll' | 'six' | 'step' | 'enter' | 'capture' | 'home' | 'stuck' | 'bad' | 'win';

let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(next: boolean) {
  muted = next;
}

function audio(): AudioContext | null {
  if (muted) return null;
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

interface Blip {
  freq: number;
  to?: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  at?: number;
}

function blips(notes: Blip[]) {
  const ac = audio();
  if (!ac) return;
  const now = ac.currentTime;
  for (const note of notes) {
    const start = now + (note.at ?? 0);
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    osc.type = note.type ?? 'triangle';
    osc.frequency.setValueAtTime(note.freq, start);
    if (note.to) osc.frequency.exponentialRampToValueAtTime(note.to, start + note.dur);
    const peak = note.gain ?? 0.15;
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(peak, start + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + note.dur);
    osc.connect(amp).connect(ac.destination);
    osc.start(start);
    osc.stop(start + note.dur + 0.02);
  }
}

/** Short filtered noise burst — the die tumbling in a cup. */
function rattle(dur = 0.3, gain = 0.14) {
  const ac = audio();
  if (!ac) return;
  const frames = Math.floor(ac.sampleRate * dur);
  const buffer = ac.createBuffer(1, frames, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    const fade = 1 - i / frames;
    // Clumped noise reads as plastic knocking rather than static hiss.
    data[i] = (Math.random() * 2 - 1) * fade * (i % 900 < 120 ? 1 : 0.16);
  }
  const source = ac.createBufferSource();
  source.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1500;
  filter.Q.value = 0.9;
  const amp = ac.createGain();
  amp.gain.value = gain;
  source.connect(filter).connect(amp).connect(ac.destination);
  source.start();
}

export function play(kind: Sfx) {
  switch (kind) {
    case 'tap':
      return blips([{ freq: 620, dur: 0.05, gain: 0.08, type: 'square' }]);
    case 'roll':
      rattle(0.34);
      return blips([{ freq: 260, to: 200, dur: 0.1, at: 0.3, gain: 0.1 }]);
    case 'six':
      rattle(0.32);
      return blips([
        { freq: 660, dur: 0.09, at: 0.3, type: 'square', gain: 0.12 },
        { freq: 990, dur: 0.14, at: 0.38, type: 'square', gain: 0.11 },
      ]);
    case 'step':
      return blips([{ freq: 440, to: 380, dur: 0.045, gain: 0.07, type: 'square' }]);
    case 'enter':
      return blips([
        { freq: 380, to: 620, dur: 0.1, gain: 0.11 },
        { freq: 760, dur: 0.1, at: 0.08, gain: 0.08 },
      ]);
    case 'capture':
      // A hard thud plus a comedy slide — this is the whole point of the game.
      return blips([
        { freq: 180, to: 48, dur: 0.34, type: 'sawtooth', gain: 0.18 },
        { freq: 720, to: 120, dur: 0.26, at: 0.02, type: 'square', gain: 0.12 },
        { freq: 300, to: 90, dur: 0.3, at: 0.18, type: 'triangle', gain: 0.1 },
      ]);
    case 'home':
      return blips([
        { freq: 784, dur: 0.11, gain: 0.12 },
        { freq: 1046, dur: 0.18, at: 0.1, gain: 0.12 },
      ]);
    case 'stuck':
      return blips([{ freq: 210, to: 150, dur: 0.2, type: 'sawtooth', gain: 0.1 }]);
    case 'bad':
      return blips([{ freq: 200, to: 110, dur: 0.22, type: 'sawtooth', gain: 0.12 }]);
    case 'win':
      return blips([
        { freq: 523, dur: 0.12, at: 0, gain: 0.13 },
        { freq: 659, dur: 0.12, at: 0.11, gain: 0.13 },
        { freq: 784, dur: 0.12, at: 0.22, gain: 0.13 },
        { freq: 1046, dur: 0.24, at: 0.33, gain: 0.14 },
        { freq: 784, dur: 0.1, at: 0.58, gain: 0.11 },
        { freq: 1318, dur: 0.4, at: 0.7, gain: 0.13 },
      ]);
  }
}
