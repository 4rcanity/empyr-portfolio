export type Sfx =
  | 'tap'
  | 'deal'
  | 'play'
  | 'liar'
  | 'good'
  | 'bad'
  | 'click'
  | 'bang'
  | 'quiet'
  | 'tick'
  | 'win';

interface Voice {
  wave: OscillatorType;
  notes: number[];
  step: number;
  hold: number;
  gain: number;
}

const VOICES: Record<Sfx, Voice> = {
  tap: { wave: 'square', notes: [520], step: 0, hold: 0.05, gain: 0.05 },
  deal: { wave: 'triangle', notes: [330, 440, 550], step: 0.07, hold: 0.09, gain: 0.06 },
  play: { wave: 'triangle', notes: [440, 520], step: 0.05, hold: 0.08, gain: 0.05 },
  liar: { wave: 'sawtooth', notes: [180, 140], step: 0.08, hold: 0.18, gain: 0.08 },
  good: { wave: 'square', notes: [392, 523], step: 0.08, hold: 0.12, gain: 0.07 },
  bad: { wave: 'sawtooth', notes: [220, 165], step: 0.09, hold: 0.16, gain: 0.08 },
  click: { wave: 'square', notes: [880, 660], step: 0.04, hold: 0.06, gain: 0.06 },
  bang: { wave: 'sawtooth', notes: [90, 60, 40], step: 0.06, hold: 0.35, gain: 0.12 },
  quiet: { wave: 'triangle', notes: [280, 220], step: 0.12, hold: 0.2, gain: 0.05 },
  tick: { wave: 'square', notes: [980], step: 0, hold: 0.03, gain: 0.04 },
  win: { wave: 'square', notes: [392, 494, 587, 784], step: 0.1, hold: 0.22, gain: 0.08 },
};

let ctx: AudioContext | null = null;
let muted = false;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function setMuted(next: boolean) {
  muted = next;
}

export function isMuted() {
  return muted;
}

export function play(kind: Sfx) {
  if (muted) return;
  const context = audio();
  if (!context) return;

  const voice = VOICES[kind];
  voice.notes.forEach((freq, index) => {
    const at = context.currentTime + index * voice.step;
    const osc = context.createOscillator();
    const amp = context.createGain();
    osc.type = voice.wave;
    osc.frequency.setValueAtTime(freq, at);
    amp.gain.setValueAtTime(0.0001, at);
    amp.gain.exponentialRampToValueAtTime(voice.gain, at + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, at + voice.hold);
    osc.connect(amp).connect(context.destination);
    osc.start(at);
    osc.stop(at + voice.hold + 0.02);
  });
}
