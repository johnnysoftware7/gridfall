/** Authored WebAudio bed — original REBOOT palette, no samples. */

let ctx: AudioContext | null = null;
let sfxOn = true;
let musicOn = false;
let musicMaster: GainNode | null = null;
let musicNext = 0;
let musicHandle = 0;

export function sfxEnabled(): boolean {
  return sfxOn;
}

export function musicEnabled(): boolean {
  return musicOn;
}

export function setSfx(on: boolean): void {
  sfxOn = on;
}

export function setMusic(on: boolean): void {
  musicOn = on;
  if (on) startMusic();
  else stopMusic();
}

function ctor(): (typeof AudioContext) | undefined {
  if (typeof window === "undefined") return undefined;
  const W = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  return W.AudioContext ?? W.webkitAudioContext;
}

function ac(needSfx = true): AudioContext | null {
  if (needSfx && !sfxOn) return null;
  const Ctor = ctor();
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function env(a: AudioContext, g: GainNode, peak: number, attack: number, hold: number, release: number): void {
  const t = a.currentTime;
  g.gain.cancelScheduledValues(t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
  g.gain.setValueAtTime(Math.max(0.0002, peak), t + attack + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
}

function tone(
  a: AudioContext,
  freq: number,
  type: OscillatorType,
  peak: number,
  attack: number,
  hold: number,
  release: number,
  dest: AudioNode = a.destination,
  slide = 0,
): void {
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, a.currentTime);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), a.currentTime + attack + hold + release);
  env(a, g, peak, attack, hold, release);
  o.connect(g);
  g.connect(dest);
  o.start();
  o.stop(a.currentTime + attack + hold + release + 0.02);
}

function noiseBurst(a: AudioContext, peak: number, dur: number, freq = 900, q = 4): void {
  const n = Math.max(1, Math.floor(a.sampleRate * dur));
  const buf = a.createBuffer(1, n, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = freq;
  f.Q.value = q;
  const g = a.createGain();
  env(a, g, peak, 0.004, 0.01, dur);
  src.connect(f);
  f.connect(g);
  g.connect(a.destination);
  src.start();
}

export function playSfx(
  kind: "select" | "move" | "attack" | "harvest" | "end" | "research" | "capture" | "ui" | "train" | "victory" | "wonder",
): void {
  const a = ac(true);
  if (!a) return;
  if (kind === "select") {
    tone(a, 740, "triangle", 0.055, 0.008, 0.02, 0.08, a.destination, 220);
    tone(a, 1180, "sine", 0.03, 0.01, 0.01, 0.07);
  } else if (kind === "move") {
    tone(a, 196, "sine", 0.07, 0.01, 0.04, 0.1, a.destination, 90);
    tone(a, 392, "triangle", 0.035, 0.02, 0.03, 0.09, a.destination, 40);
  } else if (kind === "attack") {
    noiseBurst(a, 0.11, 0.14, 420, 1.6);
    tone(a, 110, "sawtooth", 0.09, 0.004, 0.03, 0.16, a.destination, -50);
    tone(a, 58, "square", 0.04, 0.002, 0.02, 0.12);
  } else if (kind === "harvest") {
    tone(a, 523, "sine", 0.06, 0.01, 0.04, 0.14);
    tone(a, 784, "triangle", 0.045, 0.03, 0.05, 0.16);
    tone(a, 1046, "sine", 0.03, 0.06, 0.04, 0.12);
  } else if (kind === "end") {
    tone(a, 220, "sine", 0.055, 0.02, 0.06, 0.16, a.destination, -70);
    tone(a, 146, "triangle", 0.03, 0.04, 0.08, 0.18);
  } else if (kind === "research") {
    tone(a, 392, "triangle", 0.05, 0.01, 0.05, 0.12);
    tone(a, 494, "sine", 0.045, 0.06, 0.05, 0.14);
    tone(a, 659, "triangle", 0.04, 0.12, 0.06, 0.18);
  } else if (kind === "capture") {
    tone(a, 262, "square", 0.05, 0.01, 0.05, 0.1);
    tone(a, 392, "triangle", 0.055, 0.06, 0.08, 0.16);
    tone(a, 523, "sine", 0.04, 0.12, 0.1, 0.18);
  } else if (kind === "train") {
    tone(a, 330, "square", 0.04, 0.004, 0.03, 0.06);
    tone(a, 440, "triangle", 0.05, 0.04, 0.05, 0.1, a.destination, 80);
  } else if (kind === "wonder") {
    tone(a, 196, "sine", 0.06, 0.02, 0.12, 0.28);
    tone(a, 294, "triangle", 0.05, 0.08, 0.14, 0.3);
    tone(a, 392, "sine", 0.04, 0.16, 0.16, 0.32);
  } else if (kind === "victory") {
    tone(a, 262, "sine", 0.07, 0.02, 0.12, 0.22);
    tone(a, 330, "triangle", 0.06, 0.1, 0.14, 0.24);
    tone(a, 392, "sine", 0.06, 0.2, 0.16, 0.3);
    tone(a, 523, "triangle", 0.05, 0.34, 0.2, 0.4);
    tone(a, 784, "sine", 0.03, 0.48, 0.18, 0.36);
  } else {
    tone(a, 620, "sine", 0.035, 0.004, 0.02, 0.05);
  }
}

function startMusic(): void {
  const a = ac(false);
  if (!a || !musicOn) return;
  stopMusic(false);
  musicMaster = a.createGain();
  musicMaster.gain.setValueAtTime(0.0001, a.currentTime);
  musicMaster.gain.exponentialRampToValueAtTime(0.045, a.currentTime + 1.2);
  musicMaster.connect(a.destination);
  musicNext = a.currentTime + 0.05;
  scheduleMusic();
}

function stopMusic(fade = true): void {
  if (musicHandle) {
    if (typeof window !== "undefined") window.clearTimeout(musicHandle);
    musicHandle = 0;
  }
  if (musicMaster && ctx) {
    const g = musicMaster;
    if (fade) {
      g.gain.cancelScheduledValues(ctx.currentTime);
      g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
      window.setTimeout(() => {
        try { g.disconnect(); } catch { /* already gone */ }
      }, 450);
    } else {
      try { g.disconnect(); } catch { /* already gone */ }
    }
  }
  musicMaster = null;
}

function scheduleMusic(): void {
  const a = ctx;
  const master = musicMaster;
  if (!a || !master || !musicOn) return;
  const motif = [146.83, 174.61, 196, 220, 261.63, 196, 174.61, 146.83];
  while (musicNext < a.currentTime + 2.4) {
    const step = motif[Math.floor((musicNext * 0.42) % motif.length)];
    const o = a.createOscillator();
    const g = a.createGain();
    const f = a.createBiquadFilter();
    o.type = "sine";
    o.frequency.setValueAtTime(step, musicNext);
    f.type = "lowpass";
    f.frequency.setValueAtTime(680, musicNext);
    g.gain.setValueAtTime(0.0001, musicNext);
    g.gain.exponentialRampToValueAtTime(0.22, musicNext + 0.18);
    g.gain.exponentialRampToValueAtTime(0.0001, musicNext + 1.6);
    o.connect(f);
    f.connect(g);
    g.connect(master);
    o.start(musicNext);
    o.stop(musicNext + 1.7);

    const pad = a.createOscillator();
    const pg = a.createGain();
    pad.type = "triangle";
    pad.frequency.setValueAtTime(step / 2, musicNext);
    pg.gain.setValueAtTime(0.0001, musicNext);
    pg.gain.exponentialRampToValueAtTime(0.09, musicNext + 0.4);
    pg.gain.exponentialRampToValueAtTime(0.0001, musicNext + 2.1);
    pad.connect(pg);
    pg.connect(master);
    pad.start(musicNext);
    pad.stop(musicNext + 2.15);

    musicNext += 1.55;
  }
  musicHandle = window.setTimeout(scheduleMusic, 700);
}
