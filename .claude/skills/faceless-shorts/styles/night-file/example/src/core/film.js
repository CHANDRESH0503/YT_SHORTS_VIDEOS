// Film finish + camera language for the 3D styles (deep-dive, night-file, tall-tale; identical copy in each, edit together).
//  · loadFilm()            await once in main.js before makeEngine: reads look.json (grade, tone map, LUT, halation, CA)
//                          and slots.json (per-shot fx: ramp, focus_pull) when the bilingual pipeline wrote them.
//  · makeFinish(w, h)      the last colour pass (after tone map + grade): 3D LUT, halation, edge chromatic aberration
//  · fx('S04')             that shot's {ramp, focus_pull} from slots.json (null fields when unset)
//  · pin('nose', vec3)     after E.render: logs the point's screen position for this frame; capture.mjs video writes
//                          <clip>.pins.json and Remotion pins a callout arrow to it (overlay kind "pin")
//  · dolly / orbitAround / craneReveal / scaleJump / handheld   camera moves with eased speed (STYLE.md "Camera language")
// Without look.json everything is off and the engine looks exactly as before.
import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { wobble, easeInOut } from './motion.js';

export const FILM = { cfg: {}, lut: null, slots: {}, cam: null, t: 0, pinLog: [] };

const TONEMAPS = { aces: THREE.ACESFilmicToneMapping, agx: THREE.AgXToneMapping, neutral: THREE.NeutralToneMapping };
/** renderer tone curve from look.json (`tonemap`: aces | agx | neutral); keeps the style's own default otherwise */
export function applyTonemap(renderer) {
  const tm = TONEMAPS[FILM.cfg.tonemap];
  if (tm !== undefined) renderer.toneMapping = tm;
}

function parseCube(text) {
  let n = 0; const vals = [];
  for (const line of text.split('\n')) {
    const s = line.trim();
    if (!s || s[0] === '#') continue;
    if (s.startsWith('LUT_3D_SIZE')) { n = +s.split(/\s+/)[1]; continue; }
    if (/^[A-Z_]/.test(s)) continue;
    const p = s.split(/\s+/).map(Number);
    if (p.length === 3 && p.every(Number.isFinite)) vals.push(p);
  }
  if (!n || vals.length !== n * n * n) throw new Error(`bad .cube: size ${n}, ${vals.length} entries`);
  const data = new Uint8Array(n * n * n * 4);
  vals.forEach((v, i) => { data[i * 4] = v[0] * 255; data[i * 4 + 1] = v[1] * 255; data[i * 4 + 2] = v[2] * 255; data[i * 4 + 3] = 255; });
  const tex = new THREE.Data3DTexture(data, n, n, n);   // .cube order (red fastest) = texture x, y, z
  tex.format = THREE.RGBAFormat; tex.type = THREE.UnsignedByteType;
  tex.minFilter = tex.magFilter = THREE.LinearFilter; tex.wrapS = tex.wrapT = tex.wrapR = THREE.ClampToEdgeWrapping;
  tex.unpackAlignment = 1; tex.needsUpdate = true;
  return { tex, n };
}

/** read look.json + slots.json if present (both optional). look.json:
 *  { grade, tonemap: "aces"|"agx"|"neutral", lut: "look/lut.cube", lut_mix: 0..1, halation: 0..1, ca: px } */
export async function loadFilm() {
  const get = async (f) => { try { const r = await fetch(f, { cache: 'no-store' }); return r.ok ? r : null; } catch { return null; } };
  const lj = await get('look.json'); if (lj) FILM.cfg = await lj.json();
  if (FILM.cfg.lut) { const c = await get(FILM.cfg.lut); if (c) FILM.lut = parseCube(await c.text()); }
  const sj = await get('slots.json');
  if (sj) for (const s of await sj.json()) FILM.slots[s.id] = s;
  return FILM;
}

/** per-shot fx from slots.json: { ramp: {at, slow, len} | null, focus_pull: {at, from_m, to_m, len} | null, event } */
export function fx(id) {
  const s = FILM.slots[id] || {};
  return { ramp: s.ramp || null, focus_pull: s.focus_pull || null, event: s.event ?? null };
}

const FINISH = {
  uniforms: { tDiffuse: { value: null }, uLut: { value: null }, uLutN: { value: 33 }, uLutMix: { value: 0 },
    uHal: { value: 0 }, uCA: { value: 0 }, uRes: { value: new THREE.Vector2(1080, 1920) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `precision highp sampler3D;
    uniform sampler2D tDiffuse; uniform sampler3D uLut; uniform float uLutN, uLutMix, uHal, uCA; uniform vec2 uRes; varying vec2 vUv;
    float luma(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
    void main(){
      vec2 d = vUv - 0.5; vec2 off = d * length(d) * 2.0 * uCA / uRes;      // edge-weighted chromatic aberration (px at the corners)
      vec4 c = texture2D(tDiffuse, vUv);
      if (uCA > 0.0) { c.r = texture2D(tDiffuse, vUv + off).r; c.b = texture2D(tDiffuse, vUv - off).b; }
      if (uHal > 0.0) {                                                       // halation: warm glow bleeding off bright edges
        vec3 g = vec3(0.0);
        for (int i = 0; i < 12; i++) { float a = float(i) * 0.5236; vec2 o = vec2(cos(a), sin(a));
          g += max(texture2D(tDiffuse, vUv + o * 7.0 / uRes).rgb - 0.78, 0.0); g += max(texture2D(tDiffuse, vUv + o * 16.0 / uRes).rgb - 0.78, 0.0) * 0.6; }
        c.rgb += uHal * luma(g) / 12.0 * vec3(1.0, 0.42, 0.22);
      }
      if (uLutMix > 0.0) { vec3 p = clamp(c.rgb, 0.0, 1.0) * (uLutN - 1.0) / uLutN + 0.5 / uLutN; c.rgb = mix(c.rgb, texture(uLut, p).rgb, uLutMix); }
      gl_FragColor = c; }`,
};

/** the finish pass (add it after the grade pass, before SMAA). Off unless look.json turns it on. */
export function makeFinish(w, h) {
  const pass = new ShaderPass(FINISH);
  pass.uniforms.uRes.value.set(w, h);
  if (FILM.lut) { pass.uniforms.uLut.value = FILM.lut.tex; pass.uniforms.uLutN.value = FILM.lut.n; }
  else pass.uniforms.uLut.value = new THREE.Data3DTexture(new Uint8Array(4), 1, 1, 1);
  const update = (look = {}) => {
    const c = FILM.cfg;
    pass.uniforms.uLutMix.value = FILM.lut ? (look.lutMix ?? c.lut_mix ?? 1) : 0;
    pass.uniforms.uHal.value = look.halation ?? c.halation ?? 0;
    pass.uniforms.uCA.value = (look.ca ?? c.ca ?? 0) * (w / 1080);
    pass.enabled = pass.uniforms.uLutMix.value > 0 || pass.uniforms.uHal.value > 0 || pass.uniforms.uCA.value > 0;
  };
  update();
  return { pass, update };
}

/** log where a world point lands on screen this frame (call after E.render in a shot). x, y in 0..1 of the frame. */
export function pin(id, v, cam = FILM.cam) {
  if (!cam) return;
  cam.updateMatrixWorld(); const p = v.clone().project(cam);
  FILM.pinLog.push([+FILM.t.toFixed(4), id, +((p.x + 1) / 2).toFixed(4), +((1 - p.y) / 2).toFixed(4), p.z < 1 ? 1 : 0]);
}

// ---- camera language: every helper takes p = 0..1 shot progress (already eased by the helper) ----
const V = (a) => (a.isVector3 ? a : new THREE.Vector3(...a));

/** dolly / walk through the set along a smooth path (Catmull-Rom through pts), eased start and stop */
export function dolly(cam, pts, p, lookAt, ease = easeInOut) {
  const curve = new THREE.CatmullRomCurve3(pts.map(V), false, 'centripetal');
  cam.position.copy(curve.getPointAt(ease(p)));
  if (lookAt) cam.lookAt(V(lookAt));
}
/** orbit around a target: radius r, height h above it, from angle a0 to a1 (radians) */
export function orbitAround(cam, target, { r = 2, h = 0.3, a0 = -0.4, a1 = 0.4 } = {}, p, ease = easeInOut) {
  const t = V(target), a = a0 + (a1 - a0) * ease(p);
  cam.position.set(t.x + Math.sin(a) * r, t.y + h, t.z + Math.cos(a) * r); cam.lookAt(t);
}
/** crane reveal: rise from low/close to high/wide while keeping the subject framed (payoff and establishing shots) */
export function craneReveal(cam, target, { from = [0, 0.4, 1.2], to = [0, 2.4, 4.5] } = {}, p, ease = easeInOut) {
  const t = V(target); cam.position.copy(t.clone().add(V(from).lerp(V(to), ease(p)))); cam.lookAt(t);
}
/** scale jump: macro → wide (or back) in one move; distance changes exponentially so the speed feels constant */
export function scaleJump(cam, target, dir, near, far, p, ease = easeInOut) {
  const t = V(target), d = near * Math.pow(far / near, ease(p));
  cam.position.copy(t.clone().add(V(dir).clone().normalize().multiplyScalar(d))); cam.lookAt(t);
}
/** organic handheld: small position + roll noise on top of any move (amt in metres; keep 0.004-0.015) */
export function handheld(cam, t, amt = 0.008, seed = 1) {
  cam.position.x += wobble(seed, t) * amt; cam.position.y += wobble(seed + 7, t * 0.8) * amt * 0.7;
  cam.rotateZ(wobble(seed + 13, t * 0.6) * amt * 0.6);
}
