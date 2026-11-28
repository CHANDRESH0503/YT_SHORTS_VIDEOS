// Deep Dive sets: each returns { scene, update(t) } built around the origin; people stand on y = 0, facing +z.
import * as THREE from 'three';
import { rbox, ellipsoid, capsule, smin, smax, sphere, mesh, rgb, noise3 } from './sdf.js';
import { lightRig } from './engine.js';

const std = (color, rough = 0.7, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, ...extra });
function canvasTex(w, h, draw, rep = [1, 1]) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 8; return t; }
const shadowed = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };
function sdfMesh(f, b, step, mat) { return shadowed(new THREE.Mesh(mesh(f, b, step), mat)); }

// ═════════════════════════ KITCHEN (warm low sun through a window) ═════════════════════════
export function kitchen(E) {
  const scene = new THREE.Scene(); scene.environment = E.envMap; scene.environmentIntensity = 0.3; scene.userData.ao = 0.85;
  scene.background = new THREE.Color('#E8DCCB'); scene.fog = new THREE.Fog('#E8DCCB', 8, 20);
  const planks = canvasTex(1024, 1024, (g, w, h) => { for (let i = 0; i < 8; i++) { const l = 150 + (i * 37) % 30; g.fillStyle = `rgb(${l + 20},${l - 18},${l - 60})`; g.fillRect(0, i * h / 8, w, h / 8); g.fillStyle = 'rgba(60,35,15,0.35)'; g.fillRect(0, i * h / 8, w, 3); for (let k = 0; k < 40; k++) { g.fillStyle = 'rgba(80,50,25,0.08)'; g.fillRect(Math.random() * w, i * h / 8 + Math.random() * h / 8, 120 + Math.random() * 200, 2); } } }, [6, 6]);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), std('#ffffff', 0.55, { map: planks })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const wallM = std('#EFE3D0', 0.9), back = shadowed(new THREE.Mesh(new THREE.BoxGeometry(14, 4, 0.2), wallM)); back.position.set(0, 2, -2.2); scene.add(back);
  const side = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 8), wallM)); side.position.set(-3, 2, 1.5); scene.add(side);
  // window in the back wall: bright sky panel + frame
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.3), new THREE.MeshBasicMaterial({ color: new THREE.Color('#DDEEFF').multiplyScalar(1.6) })); sky.position.set(1.3, 2.05, -2.09); scene.add(sky);
  const frM = std('#FFFFFF', 0.4); for (const [w, h, x, y] of [[1.75, 0.08, 1.3, 2.74], [1.75, 0.08, 1.3, 1.36], [0.08, 1.4, 0.42, 2.05], [0.08, 1.4, 2.18, 2.05], [0.05, 1.3, 1.3, 2.05]]) { const b = shadowed(new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.12), frM)); b.position.set(x, y, -2.05); scene.add(b); }
  // counter run with rounded doors, worktop, sink, kettle, plant
  const cab = std('#5F8F7E', 0.55), top = new THREE.MeshPhysicalMaterial({ color: '#F2EEE6', roughness: 0.25, clearcoat: 0.6 });
  const run = sdfMesh((p) => rbox(p, [0, 0.45, 0], [1.6, 0.45, 0.32], 0.03), [[-1.7, -0.02, -0.4], [1.7, 0.94, 0.4]], 0.02, cab); run.position.set(0.2, 0, -1.75); scene.add(run);
  for (let i = 0; i < 5; i++) { const d = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.7, 0.02), std('#6FA08E', 0.5))); d.position.set(-1.05 + i * 0.63, 0.47, -1.42); scene.add(d); const k = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 8), std('#E2C27A', 0.3, { metalness: 0.8 })); k.position.set(-0.83 + i * 0.63, 0.72, -1.4); scene.add(k); }
  const wt = shadowed(new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.05, 0.72), top)); wt.position.set(0.2, 0.93, -1.75); scene.add(wt);
  const kettle = sdfMesh((p) => smin(ellipsoid(p, [0, 0.12, 0], [0.11, 0.12, 0.11]), capsule(p, [0.09, 0.12, 0], [0.17, 0.2, 0], 0.018), 0.03), [[-0.15, -0.02, -0.15], [0.22, 0.28, 0.15]], 0.008, new THREE.MeshPhysicalMaterial({ color: '#D9534F', roughness: 0.3, clearcoat: 1 })); kettle.position.set(-0.9, 0.95, -1.7); scene.add(kettle);
  const pot = sdfMesh((p) => capsule(p, [0, 0, 0], [0, 0.16, 0], 0.09, 0.11), [[-0.13, -0.1, -0.13], [0.13, 0.28, 0.13]], 0.01, std('#C8734A', 0.6)); pot.position.set(1.5, 1.04, -1.7); scene.add(pot);
  for (let i = 0; i < 9; i++) { const l = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), std('#5E9A50', 0.6))); l.scale.set(0.6, 1.6, 0.4); l.position.set(1.5 + Math.sin(i * 2.4) * 0.08, 1.33 + (i % 3) * 0.04, -1.7 + Math.cos(i * 2.4) * 0.08); l.rotation.z = Math.sin(i * 2.4) * 0.7; scene.add(l); }
  const L = lightRig(scene, { key: '#FFD9AE', keyI: 4.2, keyPos: [2.6, 3.2, -4], target: [0.3, 0.8, 0], rimCol: '#CFE0FF', rimI: 1.2, hemiI: 0.75, shadowBox: 3.2 });
  const fill = new THREE.DirectionalLight('#FFF1E2', 1.1); fill.position.set(-1, 2.5, 4); scene.add(fill);
  return { scene, lights: L, update() {} };
}

// ═════════════════════════ X-RAY STAGE ═════════════════════════
/** glass x-ray body material: cyan fresnel edges, transparent middle */
export function xrayMaterial(color = '#4FD1E8', strength = 1) {
  return new THREE.ShaderMaterial({
    uniforms: { uCol: { value: new THREE.Color(color) }, uS: { value: strength } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 uCol; uniform float uS; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2); gl_FragColor = vec4(uCol * (0.06 + f * 1.6) * uS, 1.0); }',
  });
}
export function xrayStage(E) {
  const scene = new THREE.Scene();
  scene.background = canvasTex(64, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0B1A30'); gr.addColorStop(1, '#03070F'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  scene.add(new THREE.HemisphereLight('#9FD9FF', '#05080F', 0.6));
  const k = new THREE.DirectionalLight('#DDF4FF', 2.2); k.position.set(2, 3, 3); scene.add(k);
  const grid = new THREE.GridHelper(20, 40, '#1F6F88', '#123A4A'); grid.material.transparent = true; grid.material.opacity = 0.35; scene.add(grid);
  return { scene, update() {} };
}
/** bones + organs to put inside a Human's torso (add to human.spine). Returns { group, stomach, heart } */
export function insides() {
  const g = new THREE.Group();
  const bone = new THREE.MeshStandardMaterial({ color: '#E6F7FF', emissive: '#7FDDF2', emissiveIntensity: 0.28, roughness: 0.4 });
  const spineGeo = new THREE.CylinderGeometry(0.018, 0.02, 0.03, 16);
  for (let i = 0; i < 17; i++) { const v = new THREE.Mesh(spineGeo, bone); v.position.set(0, -0.05 + i * 0.034, -0.085 + Math.sin(i / 16 * Math.PI) * 0.015); g.add(v); }
  for (let i = 0; i < 9; i++) { const r = 0.12 + Math.sin(Math.min(1, i / 4) * 1.4) * 0.05 - (i > 5 ? (i - 5) * 0.012 : 0); const rib = new THREE.Mesh(new THREE.TorusGeometry(r, 0.0085, 8, 48, Math.PI * 1.55), bone); rib.rotation.set(Math.PI / 2 + 0.3, 0, Math.PI * 0.725); rib.scale.set(1.2, 0.85, 1); rib.position.set(0, 0.47 - i * 0.04, -0.02); g.add(rib); }
  const sternum = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.18, 6, 12), bone); sternum.position.set(0, 0.33, 0.1); g.add(sternum);
  for (const s of [-1, 1]) { const cl = new THREE.Mesh(new THREE.CapsuleGeometry(0.011, 0.14, 6, 12), bone); cl.rotation.z = Math.PI / 2 + s * 0.15; cl.position.set(s * 0.09, 0.47, 0.06); g.add(cl); }
  const pelvis = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.02, 10, 40, Math.PI), bone); pelvis.rotation.x = Math.PI / 2 + 0.6; pelvis.position.set(0, -0.06, 0); g.add(pelvis);
  const organ = (col) => new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.3, emissive: col, emissiveIntensity: 0.18 });
  const stomach = new THREE.Mesh(mesh((p) => { let d = capsule(p, [-0.02, 0.1, 0], [-0.07, 0.02, 0.01], 0.045, 0.06); d = smin(d, capsule(p, [-0.07, 0.02, 0.01], [0.03, -0.03, 0.02], 0.06, 0.045), 0.04); d = smin(d, capsule(p, [0.03, -0.03, 0.02], [0.07, 0.02, 0.02], 0.045, 0.028), 0.03); return smin(d, capsule(p, [-0.02, 0.1, 0], [-0.01, 0.2, -0.02], 0.016), 0.02); }, [[-0.15, -0.11, -0.09], [0.13, 0.24, 0.1]], 0.005), organ('#E87A8C'));
  stomach.position.set(0.03, 0.14, 0.02); g.add(stomach);
  const heart = new THREE.Mesh(mesh((p) => smin(smin(sphere(p, [-0.018, 0.02, 0], 0.035), sphere(p, [0.018, 0.02, 0], 0.035), 0.02), ellipsoid(p, [0, -0.02, 0], [0.04, 0.05, 0.035]), 0.03), [[-0.07, -0.08, -0.06], [0.07, 0.07, 0.06]], 0.004), organ('#D62839'));
  heart.position.set(0.025, 0.36, 0.03); heart.rotation.z = -0.4; g.add(heart);
  const lungs = [];
  for (const s of [-1, 1]) { const lung = new THREE.Mesh(mesh((p) => ellipsoid(p, [0, 0, 0], [0.06, 0.11, 0.07]), [[-0.08, -0.13, -0.09], [0.08, 0.13, 0.09]], 0.008), new THREE.MeshPhysicalMaterial({ color: '#F2A3AE', roughness: 0.6, transparent: true, opacity: 0.45, emissive: '#F2A3AE', emissiveIntensity: 0.1 })); lung.position.set(s * 0.085, 0.36, 0); g.add(lung); lungs.push(lung); }
  g.position.y = 0.04; return { group: g, stomach, heart, lungs };
}

// ═════════════════════════ BLOOD VESSEL (macro) ═════════════════════════
export function vessel(E) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#2A0508'); scene.fog = new THREE.FogExp2('#3A070C', 0.11);
  const tubeGeo = new THREE.CylinderGeometry(1.6, 1.6, 40, 96, 200, true); const pos = tubeGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), a = Math.atan2(z, x), n = 1 + 0.08 * noise3(Math.cos(a) * 3, y * 0.6, Math.sin(a) * 3) + 0.03 * Math.sin(y * 3 + a * 5); pos.setXYZ(i, x * n, y, z * n); }
  tubeGeo.computeVertexNormals();
  const wall = new THREE.Mesh(tubeGeo, new THREE.MeshPhysicalMaterial({ color: '#B8283A', roughness: 0.35, clearcoat: 1, side: THREE.BackSide, emissive: '#5A0A14', emissiveIntensity: 0.5 }));
  wall.rotation.x = Math.PI / 2; scene.add(wall);
  const prof = []; for (let i = 0; i <= 24; i++) { const r = i / 24 * 0.32; const t = r / 0.32; prof.push(new THREE.Vector2(r, 0.05 * (0.35 + 0.65 * Math.sqrt(1 - t * t)) * (0.6 + 0.8 * t * t))); }
  const half = new THREE.LatheGeometry(prof, 48), cellGeo = half.clone(); { const p2 = half.clone(); p2.scale(1, -1, 1); }
  const rbc = new THREE.MeshPhysicalMaterial({ color: '#D8243A', roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.2, emissive: '#5C0610', emissiveIntensity: 0.4, side: THREE.DoubleSide, sheen: 0.6, sheenColor: new THREE.Color('#ff8090') });
  const N = 46, inst = new THREE.InstancedMesh(cellGeo, rbc, N * 2), seeds = [];
  for (let i = 0; i < N; i++) seeds.push([Math.random() * Math.PI * 2, 0.55 + Math.random() * 0.75, Math.random() * 26, Math.random() * 6, Math.random() * 6]);
  scene.add(inst);
  const NB = 60, bub = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 20, 14), new THREE.MeshPhysicalMaterial({ color: '#CFE3EA', roughness: 0.1, transparent: true, opacity: 0.55, emissive: '#7FA6B4', emissiveIntensity: 0.35 }), NB); bub.count = 0; scene.add(bub);
  const bseeds = []; for (let i = 0; i < NB; i++) bseeds.push([Math.random() * Math.PI * 2, 0.3 + Math.random() * 1.0, Math.random() * 24, 0.4 + Math.random() * 1.2]);
  const RED = new THREE.Color('#D8243A'), DARK = new THREE.Color('#5E0E1C');
  const l1 = new THREE.PointLight('#FFB0A0', 60, 14, 1.4); scene.add(l1); scene.add(new THREE.HemisphereLight('#FF6B6B', '#300308', 0.9));
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3(0.5, 0.5, 0.5);
  return {
    scene, light: l1,
    /** co2 0..1 fills the vessel with grey CO2 bubbles; dark 0..1 turns the cells from bright to dark red (less oxygen) */
    update(t, camZ = 0, co2 = 0, dark = 0) {
      rbc.color.copy(RED).lerp(DARK, dark);
      bub.count = Math.floor(NB * co2);
      for (let i = 0; i < bub.count; i++) { const [a, r, z0, sz] = bseeds[i]; v.set(Math.cos(a + t * 0.2) * r, Math.sin(a + t * 0.2) * r + Math.sin(t * 2 + i) * 0.05, camZ - 1.5 - ((z0 + t * 1.8) % 24)); q.identity(); sc.setScalar(sz); m.compose(v, q, sc); bub.setMatrixAt(i, m); }
      bub.instanceMatrix.needsUpdate = true; sc.setScalar(0.5);
      l1.position.set(0.2, 0.3, camZ - 3.5);
      seeds.forEach(([a, r, z0, rx, ry], i) => {
        const z = camZ - 2.2 - ((z0 + t * 2.2) % 26); e.set(rx + t * 0.6, ry + t * 0.4, 0); q.setFromEuler(e); v.set(Math.cos(a + t * 0.1) * r, Math.sin(a + t * 0.1) * r, z);
        m.compose(v, q, sc); inst.setMatrixAt(i * 2, m); e.set(rx + t * 0.6 + Math.PI, ry + t * 0.4, 0); q.setFromEuler(e); m.compose(v, q, sc); inst.setMatrixAt(i * 2 + 1, m);
      });
      inst.instanceMatrix.needsUpdate = true;
    },
  };
}

// ═════════════════════════ SET LIBRARY (added for the bilingual pipeline) ═════════════════════════
// Real-world sets put people at the origin facing +z with the back wall at z ≈ -2.2 (like the kitchen) and set
// scene.userData.ao (ambient occlusion on). Inside-the-body sets glow, so AO stays off; they return update(t, …).
const tiles = (col, grout, n = 8) => canvasTex(512, 512, (g, w, h) => { g.fillStyle = grout; g.fillRect(0, 0, w, h); const s = w / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const l = (i * 7 + j * 3) % 5; g.fillStyle = col; g.globalAlpha = 0.92 + l * 0.015; g.fillRect(i * s + 3, j * s + 3, s - 6, s - 6); } g.globalAlpha = 1; });
function room(E, { wall = '#EFE3D0', floorTex = null, floorCol = '#C9B49A', bg = '#E8DCCB', ao = 0.85 } = {}) {
  const scene = new THREE.Scene(); scene.environment = E.envMap; scene.environmentIntensity = 0.3; scene.userData.ao = ao;
  scene.background = new THREE.Color(bg); scene.fog = new THREE.Fog(bg, 8, 20);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), std(floorTex ? '#ffffff' : floorCol, 0.6, floorTex ? { map: floorTex } : {})); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const wallM = typeof wall === 'string' ? std(wall, 0.9) : wall;
  const back = shadowed(new THREE.Mesh(new THREE.BoxGeometry(14, 4, 0.2), wallM)); back.position.set(0, 2, -2.2); scene.add(back);
  const side = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 8), wallM)); side.position.set(-3, 2, 1.5); scene.add(side);
  return scene;
}

/** BATHROOM: white tiles, mirror over a basin, towel, bathtub edge. Morning light. */
export function bathroom(E) {
  const wt = tiles('#F4F6F7', '#C9D3D8', 10), wallM = std('#ffffff', 0.3, { map: wt }); wt.repeat.set(5, 2);
  const ft = tiles('#7FA7B5', '#56727C', 6); ft.repeat.set(7, 7);
  const scene = room(E, { wall: wallM, floorTex: ft, bg: '#E4ECEF' });
  const basin = sdfMesh((p) => ssubBowl(p), [[-0.4, -0.2, -0.3], [0.4, 0.12, 0.3]], 0.012, new THREE.MeshPhysicalMaterial({ color: '#FBFBFB', roughness: 0.15, clearcoat: 1 })); basin.position.set(0.9, 0.86, -1.8); scene.add(basin);
  const stand = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.8, 24), std('#F2F2F2', 0.3))); stand.position.set(0.9, 0.4, -1.85); scene.add(stand);
  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.0), new THREE.MeshPhysicalMaterial({ color: '#BFD6DE', roughness: 0.05, metalness: 1, envMapIntensity: 1.4 })); mirror.position.set(0.9, 1.75, -2.07); scene.add(mirror);
  const frame = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.98, 1.08, 0.03), std('#D9C6A5', 0.5))); frame.position.set(0.9, 1.75, -2.105); scene.add(frame);
  const towel = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.7, 0.04), std('#F2A65A', 0.95))); towel.position.set(-1.4, 1.3, -2.07); scene.add(towel);
  const tub = sdfMesh((p) => rbox(p, [0, 0.28, 0], [0.4, 0.28, 0.9], 0.08), [[-0.5, -0.02, -1], [0.5, 0.62, 1]], 0.025, new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: 0.2, clearcoat: 0.8 })); tub.position.set(-2.4, 0, -0.9); scene.add(tub);
  lightRig(scene, { key: '#FFF1DC', keyI: 3.6, keyPos: [2.4, 3.6, 2.5], target: [0.3, 0.9, -0.5], rimCol: '#D6ECFF', rimI: 1.4, hemiI: 0.9, sky: '#F4FAFF', ground: '#9DB3BA', shadowBox: 3.2 });
  return { scene, update() {} };
}
function ssubBowl(p) { const outer = rbox(p, [0, 0, 0], [0.32, 0.09, 0.22], 0.08); const inner = ellipsoid(p, [0, 0.1, 0], [0.26, 0.16, 0.17]); return smax(outer, -inner, 0.02); }

/** BEDROOM: bed with pillows and blanket, nightstand with a warm lamp. Evening glow (lamp: { light }). */
export function bedroom(E) {
  const pl = canvasTex(1024, 1024, (g, w, h) => { for (let i = 0; i < 8; i++) { const l = 120 + (i * 41) % 26; g.fillStyle = `rgb(${l + 30},${l - 5},${l - 40})`; g.fillRect(0, i * h / 8, w, h / 8); g.fillStyle = 'rgba(50,30,15,0.3)'; g.fillRect(0, i * h / 8, w, 3); } }, [6, 6]);
  const scene = room(E, { wall: '#C9D6E8', floorTex: pl, bg: '#B9C6D8', ao: 0.9 });
  const bed = sdfMesh((p) => rbox(p, [0, 0.22, 0], [0.8, 0.22, 1.05], 0.06), [[-0.9, -0.02, -1.15], [0.9, 0.5, 1.15]], 0.025, std('#8A6248', 0.7)); bed.position.set(-1.1, 0, -1.0); scene.add(bed);
  const mattress = sdfMesh((p) => rbox(p, [0, 0.55, 0], [0.76, 0.1, 1.0], 0.08), [[-0.85, 0.4, -1.1], [0.85, 0.7, 1.1]], 0.02, std('#F5F2EC', 0.8)); mattress.position.copy(bed.position); scene.add(mattress);
  const blanket = sdfMesh((p) => rbox(p, [0, 0.66, 0.25], [0.79, 0.04, 0.72], 0.04) + 0.008 * Math.sin(p[2] * 18) * Math.sin(p[0] * 9), [[-0.86, 0.55, -0.55], [0.86, 0.76, 1.05]], 0.015, std('#3E7CC9', 0.9)); blanket.position.copy(bed.position); scene.add(blanket);
  for (const x of [-0.35, 0.35]) { const pw = sdfMesh((p) => ellipsoid(p, [0, 0, 0], [0.3, 0.08, 0.18]), [[-0.33, -0.1, -0.2], [0.33, 0.1, 0.2]], 0.012, std('#FFFFFF', 0.85)); pw.position.set(-1.1 + x, 0.72, -1.75); scene.add(pw); }
  const ns = sdfMesh((p) => rbox(p, [0, 0.28, 0], [0.24, 0.28, 0.2], 0.03), [[-0.3, -0.02, -0.25], [0.3, 0.6, 0.25]], 0.015, std('#A47B5C', 0.6)); ns.position.set(0.15, 0, -1.85); scene.add(ns);
  const shade = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 0.18, 24, 1, true), new THREE.MeshStandardMaterial({ color: '#FFE7B8', emissive: '#FFC26B', emissiveIntensity: 1.2, side: THREE.DoubleSide }))); shade.position.set(0.15, 0.95, -1.85); scene.add(shade);
  const lampL = new THREE.PointLight('#FFB45E', 6, 5, 1.6); lampL.position.set(0.15, 0.95, -1.7); scene.add(lampL);
  lightRig(scene, { key: '#FFD3A0', keyI: 2.2, keyPos: [2.2, 3, 2.4], target: [-0.5, 0.6, -0.8], rimCol: '#9FB8FF', rimI: 1.6, hemiI: 0.6, sky: '#C9D6F0', ground: '#6B5444', shadowBox: 3.4 });
  return { scene, lamp: { light: lampL }, update() {} };
}

/** STREET: sunny pavement, kerb, asphalt, building fronts with windows, lamp posts, sky gradient. Wider shadow box. */
export function street(E) {
  const scene = new THREE.Scene(); scene.environment = E.envMap; scene.environmentIntensity = 0.35; scene.userData.ao = 0.6;
  scene.background = canvasTex(64, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5FA8E8'); gr.addColorStop(0.7, '#BFE0F7'); gr.addColorStop(1, '#F4E9D8'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  scene.fog = new THREE.Fog('#CFE3F2', 14, 40);
  const pave = tiles('#D9D2C4', '#B3AA98', 8); pave.repeat.set(10, 4);
  const walk = new THREE.Mesh(new THREE.PlaneGeometry(40, 4), std('#ffffff', 0.85, { map: pave })); walk.rotation.x = -Math.PI / 2; walk.position.set(0, 0.12, -1); walk.receiveShadow = true; scene.add(walk);
  const kerb = shadowed(new THREE.Mesh(new THREE.BoxGeometry(40, 0.14, 0.2), std('#BDB6A8', 0.8))); kerb.position.set(0, 0.07, 1.0); scene.add(kerb);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(40, 14), std('#3E4249', 0.95)); road.rotation.x = -Math.PI / 2; road.position.set(0, 0, 8); road.receiveShadow = true; scene.add(road);
  for (let i = -6; i <= 6; i++) { const dash = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.12), std('#F2F2F2', 0.6)); dash.rotation.x = -Math.PI / 2; dash.position.set(i * 3, 0.005, 5); scene.add(dash); }
  const cols = ['#E9B872', '#D9786A', '#8FB3C9', '#B7C98F', '#E6D5B8'];
  for (let i = -4; i <= 4; i++) {
    const w = 3.2, hgt = 5 + ((i * 37) % 3 + 3) % 3 * 1.4, col = cols[(i + 10) % cols.length];
    const win = canvasTex(256, 512, (g, W2, H2) => { g.fillStyle = col; g.fillRect(0, 0, W2, H2); for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) { g.fillStyle = '#2E4A5E'; g.fillRect(28 + c * 76, 30 + r * 92, 48, 62); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(28 + c * 76, 30 + r * 92, 48, 8); } });
    const b = shadowed(new THREE.Mesh(new THREE.BoxGeometry(w, hgt, 3), [std(col, 0.8), std(col, 0.8), std(col, 0.8), std(col, 0.8), std('#ffffff', 0.7, { map: win }), std(col, 0.8)]));
    b.position.set(i * (w + 0.05), hgt / 2, -4.6); scene.add(b);
  }
  for (const x of [-4, 4]) { const post = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 3.6, 12), std('#2F3640', 0.5, { metalness: 0.6 }))); post.position.set(x, 1.8, 0.7); scene.add(post); const head = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), std('#FFF4D6', 0.3, { emissive: '#FFE6A8', emissiveIntensity: 0.3 }))); head.position.set(x, 3.65, 0.7); scene.add(head); }
  lightRig(scene, { key: '#FFE6C4', keyI: 4.4, keyPos: [5, 7, 4], target: [0, 0.8, 0], rimCol: '#CFE0FF', rimI: 1.2, hemiI: 1.1, sky: '#CFE6FF', ground: '#9C8F7A', shadowBox: 6 });
  return { scene, update() {} };
}

/** CLASSROOM: green chalkboard, rows of desks, wall clock (clock.hand rotates via update(t)). */
export function classroom(E) {
  const scene = room(E, { wall: '#F2E6C9', floorCol: '#B9A27E', bg: '#EDE1C4' });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.3), std('#2F5D4A', 0.9)); board.position.set(0.3, 1.75, -2.07); scene.add(board);
  const bframe = shadowed(new THREE.Mesh(new THREE.BoxGeometry(3.35, 1.45, 0.04), std('#8C6A48', 0.6))); bframe.position.set(0.3, 1.75, -2.11); scene.add(bframe);
  const desk = (x, z) => { const top = sdfMesh((p) => rbox(p, [0, 0.74, 0], [0.42, 0.025, 0.28], 0.015), [[-0.46, 0.7, -0.32], [0.46, 0.78, 0.32]], 0.012, std('#D8B98C', 0.5)); top.position.set(x, 0, z); scene.add(top);
    for (const [lx, lz] of [[-0.36, -0.22], [0.36, -0.22], [-0.36, 0.22], [0.36, 0.22]]) { const leg = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.72, 8), std('#5A6470', 0.4, { metalness: 0.6 }))); leg.position.set(x + lx, 0.36, z + lz); scene.add(leg); } };
  for (const x of [-1.6, 0, 1.6]) for (const z of [-0.6, 0.6]) desk(x, z);
  const clockF = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 40), std('#FFFFFF', 0.4))); clockF.rotation.x = Math.PI / 2; clockF.position.set(-1.9, 2.75, -2.07); scene.add(clockF);
  const hand = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.17, 0.01), std('#202020', 0.4)); hand.geometry.translate(0, 0.08, 0); hand.position.set(-1.9, 2.75, -2.04); scene.add(hand);
  lightRig(scene, { key: '#FFEED6', keyI: 3.8, keyPos: [2.5, 3.8, 3], target: [0, 0.9, -0.5], rimCol: '#D9E6FF', rimI: 1.2, hemiI: 0.9, shadowBox: 3.4 });
  return { scene, clock: { hand }, update(t) { hand.rotation.z = -t * 1.5; } };
}

/** INSIDE THE STOMACH (macro): folded pink walls, a glowing acid pool and rising bubbles. update(t, acid 0..1). */
export function stomachInside(E) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#2B0A12'); scene.fog = new THREE.FogExp2('#3A0E18', 0.09);
  const g = new THREE.SphereGeometry(6, 128, 96); const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i); const n = 1 + 0.07 * Math.abs(Math.sin(x * 1.6 + noise3(x * 0.5, y * 0.5, z * 0.5) * 3)) + 0.04 * noise3(x * 1.2, y * 1.2, z * 1.2); pos.setXYZ(i, x * n, y * n, z * n); }
  g.computeVertexNormals();
  scene.add(new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({ color: '#E0727F', roughness: 0.3, clearcoat: 1, side: THREE.BackSide, emissive: '#5A1420', emissiveIntensity: 0.45 })));
  const acidM = new THREE.MeshPhysicalMaterial({ color: '#C8E04A', roughness: 0.05, transmission: 0.2, emissive: '#9FC22A', emissiveIntensity: 0.6, clearcoat: 1 });
  const acid = new THREE.Mesh(new THREE.CircleGeometry(5.5, 64), acidM); acid.rotation.x = -Math.PI / 2; acid.position.y = -2.4; scene.add(acid);
  const NB = 70, bub = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 16, 12), new THREE.MeshPhysicalMaterial({ color: '#E8F5B0', roughness: 0.1, transparent: true, opacity: 0.7, emissive: '#B8D85A', emissiveIntensity: 0.5 }), NB); scene.add(bub);
  const seeds = Array.from({ length: NB }, (_, i) => [Math.sin(i * 12.9) * 4, Math.cos(i * 7.3) * 4, (i * 0.37) % 3, 0.5 + (i % 5) * 0.3]);
  const l = new THREE.PointLight('#FFC2A0', 50, 16, 1.4); l.position.set(0, 1.5, 2); scene.add(l); scene.add(new THREE.HemisphereLight('#FF9AA8', '#3A1A08', 0.8));
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3();
  return { scene, acid, light: l, update(t, level = 0.5) {
    acid.position.y = -2.4 + level * 1.2; acidM.emissiveIntensity = 0.4 + 0.4 * level;
    seeds.forEach(([x, z, o, sp], i) => { const y = acid.position.y + ((t * sp + o) % 3); v.set(x + Math.sin(t + i) * 0.1, y, z); s.setScalar(0.6 + (i % 3) * 0.4); m.compose(v, q, s); bub.setMatrixAt(i, m); }); bub.instanceMatrix.needsUpdate = true; } };
}

/** BRAIN NEURONS (macro): glowing cells linked by fibres; pulses travel along them. update(t, fire 0..1). */
export function brainNeurons(E) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#06081A'); scene.fog = new THREE.FogExp2('#0A0E2A', 0.08);
  const N = 70, pts = Array.from({ length: N }, (_, i) => new THREE.Vector3(Math.sin(i * 2.1) * 4.5 * ((i * 0.618) % 1), Math.cos(i * 1.3) * 3.5 * ((i * 0.414) % 1), -2.5 - ((i * 0.73) % 1) * 12));
  const cellM = new THREE.MeshStandardMaterial({ color: '#B9A6FF', emissive: '#7B5CFF', emissiveIntensity: 1.2, roughness: 0.4 });
  const cells = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.14, 3), cellM, N); const m = new THREE.Matrix4();
  pts.forEach((p, i) => { m.makeTranslation(p.x, p.y, p.z); cells.setMatrixAt(i, m); }); scene.add(cells);
  const edges = []; pts.forEach((a, i) => { for (let j = i + 1; j < N; j++) if (a.distanceTo(pts[j]) < 2.2 && edges.length < 160) edges.push([i, j]); });
  const fibM = new THREE.MeshStandardMaterial({ color: '#5D6BFF', emissive: '#3A48D8', emissiveIntensity: 0.6, roughness: 0.6 });
  edges.forEach(([i, j]) => { const a = pts[i], b = pts[j], mid = a.clone().add(b).multiplyScalar(0.5).add(new THREE.Vector3(0, 0.25, 0)); const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, mid, b), 16, 0.018, 6), fibM); scene.add(tube); });
  const NP = edges.length, pulses = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 12, 8), new THREE.MeshBasicMaterial({ color: '#E6F0FF' }), NP); pulses.count = 0; scene.add(pulses);
  scene.add(new THREE.HemisphereLight('#8C9CFF', '#05060F', 0.6)); const l = new THREE.PointLight('#C9B8FF', 18, 14, 1.5); l.position.set(0, 1, 2); scene.add(l);
  const v = new THREE.Vector3();
  return { scene, light: l, update(t, fire = 0.5) {
    cellM.emissiveIntensity = 0.45 + fire * 0.7; pulses.count = Math.floor(NP * fire);
    for (let k = 0; k < pulses.count; k++) { const [i, j] = edges[k], u = (t * 1.2 + k * 0.37) % 1; v.copy(pts[i]).lerp(pts[j], u); v.y += Math.sin(u * Math.PI) * 0.18; m.makeTranslation(v.x, v.y, v.z); pulses.setMatrixAt(k, m); }
    pulses.instanceMatrix.needsUpdate = true; } };
}

/** LUNG AIR SACS (macro): clusters of glossy pink alveoli that swell with air. update(t, breath 0..1). */
export function lungAlveoli(E) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#2A0D16'); scene.fog = new THREE.FogExp2('#3B121E', 0.06);
  const M = new THREE.MeshPhysicalMaterial({ color: '#F09AAA', roughness: 0.25, clearcoat: 1, sheen: 0.6, sheenColor: new THREE.Color('#ffd0da'), emissive: '#7A2234', emissiveIntensity: 0.35, transmission: 0.15, thickness: 0.3 });
  const NC = 26, PER = 18, inst = new THREE.InstancedMesh(new THREE.SphereGeometry(0.22, 24, 18), M, NC * PER); scene.add(inst);
  const base = []; for (let c = 0; c < NC; c++) { const cx = Math.sin(c * 2.4) * 2.2, cy = Math.cos(c * 1.7) * 2.6, cz = -1.8 - ((c * 0.61) % 1) * 8; for (let k = 0; k < PER; k++) { const a = k * 2.399, r = 0.35 * Math.sqrt(k / PER) + 0.1; base.push(new THREE.Vector3(cx + Math.cos(a) * r, cy + Math.sin(a) * r, cz + Math.sin(k * 1.3) * 0.25)); } }
  for (let c = 0; c < NC; c++) { const p = base[c * PER]; const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 6, 12), new THREE.MeshPhysicalMaterial({ color: '#B85A6C', roughness: 0.5, clearcoat: 0.4 })); tube.position.set(p.x, p.y + 3, p.z); scene.add(tube); }
  const l = new THREE.PointLight('#FFC9D2', 55, 16, 1.3); l.position.set(1.5, 1.5, 1.5); scene.add(l); scene.add(new THREE.HemisphereLight('#FFB0BE', '#2A0810', 1.0));
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3();
  return { scene, light: l, update(t, breath = 0.5) { base.forEach((p, i) => { s.setScalar(0.75 + 0.45 * breath + 0.03 * Math.sin(t * 2 + i)); m.compose(p, q, s); inst.setMatrixAt(i, m); }); inst.instanceMatrix.needsUpdate = true; } };
}

/** SKIN SURFACE (macro): soft bumpy skin with pores and fine hairs, warm light; things can land on it. */
export function skinMacro(E, { skin = '#E3A988' } = {}) {
  const scene = new THREE.Scene(); scene.environment = E.envMap; scene.environmentIntensity = 0.08; scene.background = new THREE.Color('#2A1A14'); scene.fog = new THREE.FogExp2('#3A2418', 0.12);
  const g = new THREE.PlaneGeometry(14, 14, 280, 280); const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i); let h = 0.05 * noise3(x * 1.4, y * 1.4, 0) + 0.015 * noise3(x * 6, y * 6, 2); const cx = Math.round(x * 2.2) / 2.2, cy = Math.round(y * 2.2) / 2.2, d = Math.hypot(x - cx, y - cy); if (d < 0.05) h -= (0.05 - d) * 0.8; pos.setZ(i, h); }
  g.computeVertexNormals();
  const surf = new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({ color: skin, roughness: 0.5, sheen: 0.5, sheenColor: new THREE.Color('#ffd6c2'), clearcoat: 0.2 })); surf.rotation.x = -Math.PI / 2; surf.receiveShadow = true; scene.add(surf);
  const NH = 220, hair = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.004, 0.008, 0.5, 5), std('#5A3A28', 0.6), NH); const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < NH; i++) { const x = Math.sin(i * 12.9898) * 6, z = Math.cos(i * 78.233) * 6; e.set(0.4 + (i % 7) * 0.08, i, 0.3); q.setFromEuler(e); v.set(x, 0.22, z); m.compose(v, q, s); hair.setMatrixAt(i, m); }
  hair.castShadow = true; scene.add(hair);
  lightRig(scene, { key: '#FFE2C2', keyI: 1.7, keyPos: [2.5, 2, 1], target: [0, 0, 0], rimCol: '#FFB59A', rimI: 0.9, hemiI: 0.25, sky: '#FFE9DA', ground: '#3A2418', shadowBox: 4 });
  return { scene, update() {} };
}
