let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  try {
    if (!ctx) {
      // iOS Safari braucht webkit-Prefix
      const AC =
        typeof window !== "undefined"
          ? window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
          : undefined;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

function noiseBurst(freq: number, q: number, duration: number, volume: number, delay = 0) {
  const c = ac();
  if (!c) return;
  try {
    const sr = c.sampleRate;
    const frames = Math.ceil(sr * (duration + 0.04));
    const buf = c.createBuffer(1, frames, sr);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < frames; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.04 * w) / 1.04;
      data[i] = last * 8;
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq;
    filter.Q.value = q;
    const gain = c.createGain();
    src.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    const t = c.currentTime + delay;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.start(t);
    src.stop(t + duration + 0.04);
  } catch { /* silent fail */ }
}

function warmTone(freq: number, duration: number, volume: number, delay = 0) {
  const c = ac();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = "sine";
    osc.frequency.value = freq;
    const t = c.currentTime + delay;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  } catch { /* silent fail */ }
}

export function closeSoundContext() {
  ctx?.close().catch(() => {});
  ctx = null;
}

export function playClick() {
  noiseBurst(140, 1.2, 0.04, 0.18);
}

export function playOpen() {
  noiseBurst(220, 0.9, 0.07, 0.1);
  noiseBurst(340, 1.1, 0.06, 0.08, 0.04);
}

export function playClose() {
  noiseBurst(260, 0.9, 0.06, 0.09);
  noiseBurst(160, 1.0, 0.05, 0.07, 0.035);
}

let lastType = 0;
export function playType() {
  const now = Date.now();
  if (now - lastType < 90) return;
  lastType = now;
  noiseBurst(120, 2.0, 0.022, 0.07);
}

export function playSave() {
  warmTone(196, 0.28, 0.08, 0);
  warmTone(246.94, 0.28, 0.08, 0.16);
}

export function playDelete() {
  noiseBurst(90, 0.7, 0.045, 0.14);
}

export function playBell() {
  noiseBurst(320, 1.6, 0.038, 0.16);
  warmTone(440, 0.1, 0.055, 0.01);
}

export function playStepUp() {
  noiseBurst(200, 1.4, 0.032, 0.13);
  warmTone(330, 0.12, 0.05, 0.005);
}

export function playStepDown() {
  noiseBurst(100, 1.2, 0.032, 0.13);
  warmTone(220, 0.12, 0.05, 0.005);
}
