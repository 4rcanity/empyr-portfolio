type ToneKind = 'click' | 'swoosh' | 'eliminate' | 'deal' | 'error' | 'reverse' | 'narrow' | 'blindfold' | 'shuffle';

let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctx();
  }
  return ctx;
}

export function playTone(kind: ToneKind) {
  const audio = ac();
  if (!audio) return;
  void audio.resume();
  const now = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.connect(gain);
  gain.connect(audio.destination);

  const profiles: Record<ToneKind, { f: number; t: number; type: OscillatorType; g: number }> = {
    click: { f: 880, t: 0.04, type: 'square', g: 0.03 },
    swoosh: { f: 320, t: 0.18, type: 'sawtooth', g: 0.04 },
    deal: { f: 520, t: 0.12, type: 'triangle', g: 0.035 },
    eliminate: { f: 90, t: 0.35, type: 'sawtooth', g: 0.08 },
    error: { f: 180, t: 0.12, type: 'square', g: 0.04 },
    reverse: { f: 440, t: 0.2, type: 'triangle', g: 0.04 },
    narrow: { f: 660, t: 0.15, type: 'sine', g: 0.04 },
    blindfold: { f: 140, t: 0.22, type: 'square', g: 0.05 },
    shuffle: { f: 500, t: 0.16, type: 'triangle', g: 0.04 },
  };

  const p = profiles[kind] ?? profiles.click;
  osc.type = p.type;
  osc.frequency.setValueAtTime(p.f, now);
  if (kind === 'swoosh' || kind === 'eliminate') {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, p.f * 0.4), now + p.t);
  }
  gain.gain.setValueAtTime(p.g, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + p.t);
  osc.start(now);
  osc.stop(now + p.t + 0.02);
}
