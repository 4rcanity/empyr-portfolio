/** Tiny synth for UNO table sounds. No assets, no dependencies. */

export type Sfx = 'tap' | 'deal' | 'play' | 'draw' | 'wild' | 'uno' | 'bad' | 'win';

let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(next: boolean) {
  muted = next;
}

function audio(): AudioContext | null {
  if (muted) return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
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
    const peak = note.gain ?? 0.16;
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(peak, start + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + note.dur);
    osc.connect(amp).connect(ac.destination);
    osc.start(start);
    osc.stop(start + note.dur + 0.02);
  }
}

export function play(kind: Sfx) {
  switch (kind) {
    case 'tap':
      return blips([{ freq: 520, dur: 0.06, gain: 0.09 }]);
    case 'play':
      return blips([{ freq: 380, to: 620, dur: 0.11 }]);
    case 'draw':
      return blips([{ freq: 240, to: 170, dur: 0.13, type: 'sawtooth', gain: 0.1 }]);
    case 'deal':
      return blips([
        { freq: 300, to: 480, dur: 0.08, at: 0 },
        { freq: 340, to: 540, dur: 0.08, at: 0.07 },
        { freq: 380, to: 620, dur: 0.1, at: 0.14 },
      ]);
    case 'wild':
      return blips([
        { freq: 440, to: 880, dur: 0.14, type: 'square', gain: 0.11 },
        { freq: 660, to: 1180, dur: 0.16, at: 0.08, gain: 0.09 },
      ]);
    case 'uno':
      return blips([
        { freq: 700, dur: 0.1, type: 'square', gain: 0.13 },
        { freq: 1050, dur: 0.16, at: 0.1, type: 'square', gain: 0.12 },
      ]);
    case 'bad':
      return blips([{ freq: 200, to: 110, dur: 0.22, type: 'sawtooth', gain: 0.12 }]);
    case 'win':
      return blips([
        { freq: 523, dur: 0.13, at: 0 },
        { freq: 659, dur: 0.13, at: 0.12 },
        { freq: 784, dur: 0.15, at: 0.24 },
        { freq: 1046, dur: 0.26, at: 0.36 },
      ]);
  }
}
