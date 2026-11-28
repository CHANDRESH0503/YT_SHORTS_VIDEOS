// Motion polish helpers (pure functions of time, no three.js): the animation principles that make movement read as
// "animated" instead of "interpolated". Identical copy in every style's src/core/motion.js; edit them together.
//   anticipation · overshoot/settle · follow-through · squash & stretch · staging (stagger) · speed ramp
// Rules (STYLE.md "Motion rules"): every key action = anticip → move → overshoot; every hero moving part has one
// follow-through element (tail, hair, cable, splash, shadow); one focal motion per shot; stagger the rest.

const c01 = (x) => Math.max(0, Math.min(1, x));
const smooth = (x) => { x = c01(x); return x * x * (3 - 2 * x); };

/** progress 0..1 of an action that starts at t0 and lasts dur, with an anticipation dip (-amt) before it.
 *  The value dips to -amt over `pre` s before t0, then eases to 1 (use with overshoot() for the settle). */
export function anticip(t, t0, dur, amt = 0.12, pre = 0.18) {
  if (t < t0 - pre) return 0;
  if (t < t0) { const k = (t - (t0 - pre)) / pre; return -amt * Math.sin(k * Math.PI * 0.5); }
  const k = c01((t - t0) / dur);
  return -amt * (1 - smooth(k * 3)) + easeOutCubic(k);   // continuous with the dip at t0, reaches 1 at t0 + dur
}
export const easeOutCubic = (x) => 1 - Math.pow(1 - c01(x), 3);
export const easeInOut = smooth;

/** back-ease to 1 with an overshoot of about k*10 % and a settle: progress of an action from t0 over dur */
export function overshoot(t, t0, dur, k = 1.6) {
  const x = c01((t - t0) / dur), x1 = x - 1;
  return 1 + (k + 1) * x1 * x1 * x1 + k * x1 * x1;
}

/** damped spring settle toward 1 after t0 (freq Hz, damping 0..1): pops, landings, things that wobble into place */
export function spring(t, t0, freq = 3.2, damp = 0.35) {
  if (t <= t0) return 0;
  const x = t - t0, w = 2 * Math.PI * freq;
  return 1 - Math.exp(-damp * w * x) * Math.cos(w * Math.sqrt(1 - damp * damp) * x);
}

/** follow-through: evaluate a pure motion function a little later for secondary parts (fn(t) -> number or [..]).
 *  follow(fn, t, 0.08) lags 80 ms; chain lags (0.05, 0.1, 0.15) down a tail or cable for overlapping action. */
export function follow(fn, t, lag = 0.08) { return fn(Math.max(0, t - lag)); }

/** squash & stretch around an impact at impactT: returns {y, xz} scale factors that keep volume (y * xz^2 = 1).
 *  Stretches up to `amt` while falling in, squashes on contact, springs back. */
export function squash(t, impactT, amt = 0.22, len = 0.35) {
  const d = t - impactT;
  let y = 1;
  if (d < 0 && d > -0.12) y = 1 + amt * 0.6 * (1 - -d / 0.12);              // stretch on the way in
  else if (d >= 0 && d < len) y = 1 - amt * Math.exp(-d * 9) * Math.cos(d * 26); // squash + wobble out
  return { y, xz: 1 / Math.sqrt(Math.max(0.2, y)) };
}

/** staging: element i of a group starts `step` s after the previous one; returns its local 0..1 progress */
export function stagger(t, t0, i, step = 0.08, dur = 0.4) { return easeOutCubic((t - t0 - i * step) / dur); }

/** speed ramp (slow motion around an event): remaps a shot's local time so content time `at` still lands on wall time
 *  `at`, playing at `slow`x speed for about `len` s around it and 1x elsewhere. cfg = {at, slow, len} or null. */
export function ramp(lt, cfg) {
  if (!cfg || cfg.at == null) return lt;
  const slow = cfg.slow ?? 0.35, h = (cfg.len ?? 0.6) / 2, u = lt - cfg.at;
  // raised-cosine window: content speed = 1 - (1-slow)*w(u); its integral, shifted so that u = 0 maps to `at`
  const W = (x) => (x <= -h ? 0 : x >= h ? h : 0.5 * (x + h) + (h / (2 * Math.PI)) * Math.sin((Math.PI * x) / h));
  return lt - (1 - slow) * (W(u) - h / 2);
}

/** rack focus: focus distance (m) pulled from `from` to `to` across ~`len` s centred on `at` (cfg = {at, from_m, to_m, len}) */
export function focusPull(lt, cfg, fallback = 3) {
  if (!cfg) return fallback;
  const k = smooth((lt - (cfg.at - (cfg.len ?? 0.33) / 2)) / (cfg.len ?? 0.33));
  return cfg.from_m + (cfg.to_m - cfg.from_m) * k;
}

/** organic handheld noise (-1..1, two octaves), same character as the Remotion 2.5D drift */
export function wobble(seed, t, rate = 1.6) {
  const h = (n) => { const s = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453; return (s - Math.floor(s)) * 2 - 1; };
  const oct = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return h(i) * (1 - u) + h(i + 1) * u; };
  return 0.7 * oct(t * rate) + 0.3 * oct(t * rate * 2.3 + 17);
}
