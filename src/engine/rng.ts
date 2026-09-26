/** Serializable mulberry32. State is a uint32 stored on GameState.rng. */
export function nextRng(state: number): { state: number; value: number } {
  let s = (state + 0x6d2b79f5) >>> 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) >>> 0;
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { state: s, value };
}

export function rngInt(state: number, max: number): { state: number; value: number } {
  const r = nextRng(state);
  return { state: r.state, value: Math.floor(r.value * max) };
}

export function rngPick<T>(state: number, arr: T[]): { state: number; value: T } {
  const r = rngInt(state, arr.length);
  return { state: r.state, value: arr[r.value] };
}

export function rngFloat(state: number, lo: number, hi: number): { state: number; value: number } {
  const r = nextRng(state);
  return { state: r.state, value: lo + r.value * (hi - lo) };
}
