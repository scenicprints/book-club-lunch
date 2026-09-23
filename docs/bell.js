// A two-note chime made on the fly — no sound file to load. Browsers only allow
// audio after a tap, so unlockBell() must run inside a click handler first.
let ctx;

export function unlockBell() {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    ctx.resume();
  } catch { /* no audio on this device — the screen still updates */ }
}

export function ring() {
  if (!ctx) return;
  const t = ctx.currentTime;
  for (const [freq, delay] of [[880, 0], [1318.5, 0.18]]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t + delay);
    gain.gain.exponentialRampToValueAtTime(0.35, t + delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.9);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t + delay);
    osc.stop(t + delay + 1);
  }
}
