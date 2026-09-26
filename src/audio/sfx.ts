/** Tiny WebAudio stingers — original GRIDFALL palette, no samples. */

let ctx: AudioContext | null = null;
let enabled = true;

export function sfxEnabled(): boolean {
  return enabled;
}

export function setSfx(on: boolean): void {
  enabled = on;
}

function ac(): AudioContext | null {
  if (!enabled) return null;
  const W = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  const Ctor = W.AudioContext ?? W.webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function beep(freq: number, dur: number, type: OscillatorType, gain = 0.08, slide = 0): void {
  const a = ac();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, a.currentTime);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), a.currentTime + dur);
  g.gain.setValueAtTime(gain, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  o.connect(g);
  g.connect(a.destination);
  o.start();
  o.stop(a.currentTime + dur);
}

export function playSfx(kind: "select" | "move" | "attack" | "harvest" | "end" | "research" | "capture" | "ui" | "train"): void {
  if (kind === "select") beep(620, 0.06, "triangle", 0.05);
  else if (kind === "move") {
    beep(280, 0.09, "sine", 0.07, 80);
    beep(420, 0.07, "triangle", 0.04, 40);
  } else if (kind === "attack") {
    beep(140, 0.16, "sawtooth", 0.1, -80);
    beep(90, 0.2, "square", 0.05);
  } else if (kind === "harvest") beep(520, 0.14, "sine", 0.07, 180);
  else if (kind === "end") beep(180, 0.18, "sine", 0.06, -60);
  else if (kind === "research") {
    beep(440, 0.12, "triangle", 0.06);
    beep(660, 0.16, "sine", 0.05);
  } else if (kind === "capture") {
    beep(330, 0.12, "square", 0.06);
    beep(495, 0.18, "triangle", 0.07);
  } else if (kind === "train") beep(360, 0.1, "triangle", 0.06, 120);
  else beep(500, 0.05, "sine", 0.04);
}
