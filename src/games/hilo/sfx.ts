export type Sfx =
  | 'tap'
  | 'deal'
  | 'good'
  | 'bad'
  | 'out'
  | 'mine'
  | 'wild'
  | 'shuffle'
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
  tap: { wave: 'square', notes: [660], step: 0, hold: 0.05, gain: 0.05 },
  deal: { wave: 'triangle', notes: [420, 560], step: 0.06, hold: 0.08, gain: 0.06 },
  good: { wave: 'square', notes: [523, 784], step: 0.07, hold: 0.11, gain: 0.07 },
  bad: { wave: 'sawtooth', notes: [220, 165], step: 0.09, hold: 0.16, gain: 0.08 },
  out: { wave: 'sawtooth', notes: [330, 247, 165, 110], step: 0.09, hold: 0.2, gain: 0.09 },
  mine: { wave: 'square', notes: [140, 90, 60], step: 0.07, hold: 0.26, gain: 0.11 },
  wild: { wave: 'triangle', notes: [880, 1175], step: 0.05, hold: 0.1, gain: 0.06 },
  shuffle: { wave: 'triangle', notes: [400, 500, 600, 700, 800], step: 0.04, hold: 0.06, gain: 0.05 },
  tick: { wave: 'square', notes: [1200], step: 0, hold: 0.03, gain: 0.04 },
  win: { wave: 'square', notes: [523, 659, 784, 1047, 1319], step: 0.11, hold: 0.24, gain: 0.09 },
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
