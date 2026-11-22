// Ember Court — sound, synthesized live with WebAudio. No audio files, no
// network: every effect is an oscillator blip, so the game stays silent
// until the player first clicks (browsers require a gesture for audio).
let ctx = null;
let muted = false;

export function isMuted() { return muted; }
export function toggleMute() { muted = !muted; return muted; }

function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function blip(freq, dur, type = 'sine', vol = 0.12, slide = 0) {
  if (muted) return;
  const ac = ensureCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), ac.currentTime + dur);
  gain.gain.setValueAtTime(vol, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + dur);
}

export function playCardSound() { blip(520, 0.12, 'triangle', 0.14, 220); }
export function drawSound() { blip(760, 0.07, 'sine', 0.07, 120); }
export function hitSound(big) { blip(big ? 140 : 200, 0.18, 'sawtooth', 0.12, -90); }
export function healSound() { blip(660, 0.2, 'sine', 0.1, 220); blip(880, 0.25, 'sine', 0.07, 0); }
export function shieldSound() { blip(320, 0.15, 'square', 0.06, 80); }
export function surgeSound() { blip(440, 0.1, 'triangle', 0.13, 440); blip(880, 0.12, 'triangle', 0.1, 220); }
export function turnSound() { blip(392, 0.1, 'triangle', 0.1, 0); }
export function winSound() {
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => blip(f, 0.3, 'triangle', 0.13, 0), i * 130));
}
export function loseSound() {
  [392, 330, 262, 196].forEach((f, i) => setTimeout(() => blip(f, 0.32, 'sawtooth', 0.08, -40), i * 150));
}
export function clickSound() { blip(600, 0.05, 'sine', 0.06, 0); }
