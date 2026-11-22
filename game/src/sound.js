// Ember Duel — tiny synthesized sounds via WebAudio. No audio files, no network.
// Every effect is a short oscillator blip so the game stays a single static folder.

let ctx = null;
let muted = false;

/** True while sound is silenced. */
export function isMuted() {
  return muted;
}

/** Flip the mute switch and report the new state. */
export function toggleMute() {
  muted = !muted;
  return muted;
}

/** Lazily create the audio context on the first user gesture. */
function audio() {
  if (muted) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Play one short tone: frequency in Hz, length in seconds, wave shape, gain. */
export function tone(freq, seconds = 0.12, type = 'sine', gain = 0.12, when = 0) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  amp.gain.setValueAtTime(gain, t0);
  amp.gain.exponentialRampToValueAtTime(0.001, t0 + seconds);
  osc.connect(amp).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + seconds + 0.02);
}

/** A soft click when a card is picked up. */
export function soundPick() {
  tone(620, 0.07, 'triangle', 0.08);
}

/** A warm thump when a card is played. */
export function soundPlay() {
  tone(320, 0.12, 'triangle', 0.14);
  tone(480, 0.1, 'sine', 0.1, 0.05);
}

/** A low hit when damage lands. */
export function soundHit() {
  tone(140, 0.18, 'sawtooth', 0.12);
  tone(90, 0.2, 'square', 0.07, 0.03);
}

/** A bright chime when a card is drawn. */
export function soundDraw() {
  tone(880, 0.08, 'sine', 0.07);
  tone(1174, 0.09, 'sine', 0.06, 0.06);
}

/** A rising fanfare for a win. */
export function soundWin() {
  [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.12, i * 0.12));
}

/** A falling sigh for a loss. */
export function soundLose() {
  [392, 330, 262, 196].forEach((f, i) => tone(f, 0.25, 'sine', 0.1, i * 0.14));
}

/** A short turn-change blip. */
export function soundTurn() {
  tone(440, 0.08, 'sine', 0.08);
  tone(554, 0.08, 'sine', 0.07, 0.07);
}
