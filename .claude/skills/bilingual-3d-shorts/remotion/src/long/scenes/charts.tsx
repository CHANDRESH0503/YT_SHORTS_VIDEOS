import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Bg, C, Center, Coin, Label, MONTHS, SceneProps, btc, clamp, dayOf, ease, eout, fmt, font, glow, lerp, monthStart, range, rnd, sp, tr} from '../kit';

const X0 = 170, X1 = 1730, Y0 = 170, Y1 = 800;

const pathOf = (pts: [number, number][]) => pts.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ');

// The 2025 BTC price line. p: {a:"MM-DD", b:"MM-DD", draw, mark:[{d, l}], mode: normal|green|red|crash|longrun}
export const Chart: React.FC<SceneProps> = ({p, lang, f, full}) => {
	const a = dayOf(p.a ?? '01-01');
	const b = Math.min(364, dayOf(p.b ?? '12-31'));
	const short = b - a <= 15;
	const N = short ? 1400 : 420;
	const xs: number[] = [], vs: number[] = [];
	for (let i = 0; i <= N; i++) {
		const d = a + ((b - a) * i) / N;
		xs.push(d);
		vs.push(btc(d));
	}
	const lo = Math.min(...vs), hi = Math.max(...vs);
	const pad = (hi - lo) * 0.12 + 1;
	const ymin = lo - pad, ymax = hi + pad;
	const X = (d: number) => lerp(X0, X1, (d - a) / Math.max(1e-6, b - a));
	const Y = (v: number) => lerp(Y1, Y0, (v - ymin) / (ymax - ymin));
	const u = f / Math.max(1, full);
	const dp = p.draw ? ease(clamp(u * 1.3)) : 1;
	const k = Math.max(2, Math.floor(N * dp));
	const pts: [number, number][] = xs.slice(0, k + 1).map((d, i) => [X(d), Y(vs[i])]);
	const mode = p.mode ?? 'normal';
	const lineCol = mode === 'green' ? C.green : mode === 'red' ? C.red : C.orange;
	const crashDay = 282.88;
	const head = pts[pts.length - 1];
	const headDay = xs[Math.min(k, N)];
	const headV = vs[Math.min(k, N)];
	const isRed = mode === 'red' || (mode === 'crash' && headDay > crashDay);
	const pulse = 1 + Math.sin(f / 4) * 0.15;
	// split path for crash mode
	let pre = pts, post: [number, number][] = [];
	if (mode === 'crash') {
		const idx = xs.findIndex((d) => d > crashDay);
		if (idx > 0 && idx < pts.length) {
			pre = pts.slice(0, idx + 1);
			post = pts.slice(idx);
		}
	}
	const area = `${pathOf(pts)} L${head[0]},${Y1} L${X0},${Y1} Z`;
	// gridlines
	const step = (ymax - ymin) > 30 ? 10 : (ymax - ymin) > 12 ? 5 : 2;
	const gl: number[] = [];
	for (let v = Math.ceil(ymin / step) * step; v < ymax; v += step) gl.push(v);
	const ticks: {x: number; t: string}[] = [];
	if (!short) monthStart.forEach((m, i) => m >= a && m <= b && ticks.push({x: X(m), t: MONTHS[lang][i]}));
	else for (let d = Math.ceil(a); d <= b; d += 2) ticks.push({x: X(d), t: `${MONTHS[lang][9]} ${d - 272}`});
	const cam = mode === 'crash' && headDay > crashDay ? Math.sin(f * 1.7) * 6 * clamp(1 - (headDay - crashDay) * 2) : 0;
	return (
		<AbsoluteFill>
			<Bg f={f} tint={isRed ? '#2a0b16' : C.bg1} />
			<svg width={1920} height={1080} style={{position: 'absolute', transform: `translate(${cam}px, ${cam * 0.6}px)`}}>
				<defs>
					<linearGradient id="ar" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor={isRed ? C.red : lineCol} stopOpacity={0.35} />
						<stop offset="100%" stopColor={isRed ? C.red : lineCol} stopOpacity={0} />
					</linearGradient>
					<filter id="gl"><feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
				</defs>
				{gl.map((v) => (
					<g key={v}>
						<line x1={X0} x2={X1} y1={Y(v)} y2={Y(v)} stroke={C.line} strokeDasharray="4 10" strokeWidth={1.5} />
						<text x={X1 + 18} y={Y(v) + 8} fill={C.dim} fontSize={24} fontFamily={font('en', 'mono')}>${v}k</text>
					</g>
				))}
				{ticks.map((t, i) => (
					<text key={i} x={t.x} y={Y1 + 44} fill={C.dim} fontSize={24} textAnchor="middle" fontFamily={font(lang, 'mono')}>{t.t}</text>
				))}
				<path d={area} fill="url(#ar)" />
				{mode === 'longrun' ? (
					<>
						<path d={pathOf(pts)} stroke={C.orange} strokeOpacity={0.45} strokeWidth={5} fill="none" />
						<circle cx={X(282.92)} cy={Y(104.8)} r={46 * pulse} fill="none" stroke={C.red} strokeWidth={6} filter="url(#gl)" />
						<text x={X(282.92)} y={Y(104.8) + 100} fill={C.red} fontSize={40} textAnchor="middle" fontFamily={font(lang)} fontWeight={700}>
							{lang === 'ta' ? 'குறுகிய காலம்' : 'the short run'}
						</text>
						<path d={`M${X1 - 40},${Y(90)} Q${X1 + 60},${Y(120)} ${X1 + 120},${Y(150)}`} stroke={C.green} strokeWidth={6} strokeDasharray="14 12" fill="none"
							strokeDashoffset={-f * 2} opacity={eout(u * 2)} />
						<text x={X1 - 120} y={Y0 + 10} fill={C.green} fontSize={40} fontFamily={font(lang)} fontWeight={700} opacity={eout(u * 2)} textAnchor="end">
							{lang === 'ta' ? 'நீண்ட காலம் →' : 'the long run →'}
						</text>
					</>
				) : (
					<>
						<path d={pathOf(pre)} stroke={lineCol} strokeWidth={6} fill="none" filter="url(#gl)" strokeLinejoin="round" />
						{post.length ? <path d={pathOf(post)} stroke={C.red} strokeWidth={7} fill="none" filter="url(#gl)" strokeLinejoin="round" /> : null}
					</>
				)}
				{(p.mark ?? []).map((m: any, i: number) => {
					const md = dayOf(m.d);
					if (md < a - 0.5 || md > b + 0.5 || (p.draw && headDay < md - 0.01)) return null;
					const appear = p.draw ? sp(f, Math.round(((md - a) / (b - a)) * full / 1.3)) : sp(f, 6 + i * 8);
					const mx = X(md), my = Y(btc(md));
					const right = mx < 1250;
					return (
						<g key={i} opacity={clamp(appear * 1.4)}>
							<line x1={mx} x2={mx} y1={my} y2={Y1} stroke={C.white} strokeOpacity={0.35} strokeDasharray="6 8" strokeWidth={2} />
							<circle cx={mx} cy={my} r={12 + 4 * Math.sin(f / 5)} fill={C.white} filter="url(#gl)" />
							<g transform={`translate(${right ? mx + 26 : mx - 26}, ${my - 70}) scale(${0.6 + 0.4 * appear})`}>
								<rect x={right ? 0 : -560} y={-38} width={560} height={66} rx={16} fill="rgba(5,10,22,0.9)" stroke={C.white} strokeOpacity={0.5} strokeWidth={2} />
								<text x={right ? 22 : -22} y={8} fill={C.white} fontSize={lang === 'ta' ? 28 : 32} fontWeight={700} fontFamily={font(lang)} textAnchor={right ? 'start' : 'end'}>
									{tr(m.l, lang)}
								</text>
							</g>
						</g>
					);
				})}
				{mode !== 'longrun' ? (
					<g>
						<circle cx={head[0]} cy={head[1]} r={13 * pulse} fill={isRed ? C.red : lineCol} filter="url(#gl)" />
						<circle cx={head[0]} cy={head[1]} r={30 * pulse} fill="none" stroke={isRed ? C.red : lineCol} strokeOpacity={0.4} strokeWidth={3} />
						{p.draw ? (
							<g transform={`translate(${Math.min(head[0] + 24, X1 - 200)}, ${head[1] - 34})`}>
								<rect x={0} y={-30} width={210} height={52} rx={12} fill={isRed ? C.red : lineCol} />
								<text x={105} y={6} fill="#0b0b12" fontSize={30} fontWeight={800} textAnchor="middle" fontFamily={font('en', 'mono')}>
									${fmt(Math.round(headV * 10) * 100)}
								</text>
							</g>
						) : null}
					</g>
				) : null}
				<text x={X0} y={112} fill={C.dim} fontSize={26} fontFamily={font('en', 'mono')} letterSpacing={4}>BTC / USD · 2025</text>
			</svg>
			{isRed && mode === 'crash' ? <AbsoluteFill style={{boxShadow: `inset 0 0 ${180 + 60 * Math.sin(f / 3)}px rgba(255,40,70,0.45)`}} /> : null}
		</AbsoluteFill>
	);
};

// Oct 10 intraday cliff (UTC hours)
const ID: [number, number][] = [[20, 121.5], [20.5, 121.4], [20.83, 121.2], [21.0, 117], [21.08, 113], [21.17, 110], [21.25, 106.5], [21.33, 104.8], [21.42, 106.2], [21.5, 107.4], [21.83, 110.5], [22.5, 112], [23.5, 111.5], [26, 112.5]];
const idv = (h: number) => {
	for (let i = 0; i < ID.length - 1; i++) if (h <= ID[i + 1][0]) {
		const t = (h - ID[i][0]) / (ID[i + 1][0] - ID[i][0]);
		return ID[i][1] + (ID[i + 1][1] - ID[i][1]) * t + Math.sin(h * 97) * 0.35 + Math.sin(h * 211) * 0.2;
	}
	return ID[ID.length - 1][1];
};
export const Intraday: React.FC<SceneProps> = ({p, lang, f, full}) => {
	const u = f / full;
	const h1 = p.stage ? 26 : lerp(20.3, 21.45, ease(clamp(u * 1.2)));
	const hA = 20, hB = p.stage ? 26 : 22;
	const X = (h: number) => lerp(X0, X1, (h - hA) / (hB - hA));
	const Y = (v: number) => lerp(Y1, Y0, (v - 100) / 25);
	const pts: [number, number][] = [];
	for (let h = hA; h <= h1; h += 0.004) pts.push([X(h), Y(idv(h))]);
	const head = pts[pts.length - 1];
	const v = idv(h1);
	const shake = h1 > 21 && h1 < 21.4 ? Math.sin(f * 2.3) * 9 : 0;
	return (
		<AbsoluteFill>
			<Bg f={f} tint="#2a0b16" />
			<svg width={1920} height={1080} style={{position: 'absolute', transform: `translate(${shake}px, ${shake * 0.5}px)`}}>
				{[105, 110, 115, 120].map((g) => (
					<g key={g}>
						<line x1={X0} x2={X1} y1={Y(g)} y2={Y(g)} stroke={g === 105 ? C.red : C.line} strokeOpacity={g === 105 ? 0.7 : 1} strokeDasharray="4 10" strokeWidth={2} />
						<text x={X1 + 18} y={Y(g) + 8} fill={g === 105 ? C.red : C.dim} fontSize={26} fontFamily={font('en', 'mono')}>${g}k</text>
					</g>
				))}
				{[20, 21, 22, 23, 24, 25, 26].filter((h) => h <= hB).map((h) => (
					<text key={h} x={X(h)} y={Y1 + 44} fill={C.dim} fontSize={24} textAnchor="middle" fontFamily={font('en', 'mono')}>{`${String(h % 24).padStart(2, '0')}:00`}</text>
				))}
				<path d={pathOf(pts)} stroke={C.red} strokeWidth={6} fill="none" style={{filter: `drop-shadow(0 0 10px ${C.red})`}} />
				<circle cx={head[0]} cy={head[1]} r={14} fill={C.white} style={{filter: `drop-shadow(0 0 14px ${C.red})`}} />
				<g transform={`translate(${Math.min(head[0] + 26, X1 - 230)}, ${head[1] + 10})`}>
					<rect x={0} y={-30} width={220} height={54} rx={12} fill={C.red} />
					<text x={110} y={8} fill="#fff" fontSize={30} fontWeight={800} textAnchor="middle" fontFamily={font('en', 'mono')}>${fmt(Math.round(v * 10) * 100)}</text>
				</g>
				<text x={X0} y={112} fill={C.dim} fontSize={26} fontFamily={font('en', 'mono')} letterSpacing={4}>
					{lang === 'ta' ? 'BTC · அக் 10, 2025 · UTC' : 'BTC · FRI OCT 10, 2025 · UTC'}
				</text>
				{p.stage ? (
					<g opacity={sp(f, 8)}>
						<circle cx={X(21.33)} cy={Y(104.8)} r={40} fill="none" stroke={C.white} strokeWidth={4} />
						<text x={X(21.33) + 60} y={Y(104.8) + 12} fill={C.white} fontSize={38} fontWeight={700} fontFamily={font(lang)}>
							{lang === 'ta' ? '$105,000-க்கு கீழ்' : 'below $105,000'}
						</text>
					</g>
				) : null}
			</svg>
		</AbsoluteFill>
	);
};

// price falling through stacked liquidation levels; p.stage 0..3 = how far/fast the cascade has gone
export const Cascade: React.FC<SceneProps> = ({p, lang, f, full}) => {
	const st = p.stage ?? 0;
	const u = f / full;
	const levels = Array.from({length: 9}, (_, i) => 120 - i * 2.2);
	const speed = [0.35, 0.6, 1, 1][st];
	const start = [0, 1.5, 3, 5][st];
	const prog = start + ease(clamp(u)) * [1.6, 2.2, 4.2, 4.5][st] * speed * 1.6;
	const price = 121.5 - prog * 2.2;
	const X = (i: number) => 260 + i * 8;
	const Y = (v: number) => lerp(840, 160, (v - 100) / 24);
	const n = 120;
	const trail: [number, number][] = [];
	for (let i = 0; i <= n; i++) {
		const t = i / n;
		const pv = 121.5 - prog * 2.2 * Math.pow(t, 1.6) + Math.sin(i * 1.3) * 0.25;
		trail.push([X(i * 1.15), Y(pv)]);
	}
	return (
		<AbsoluteFill>
			<Bg f={f} tint={st >= 2 ? '#2a0b16' : C.bg1} />
			<svg width={1920} height={1080} style={{position: 'absolute'}}>
				{levels.map((lv, i) => {
					const hit = price <= lv;
					const hf = hit ? clamp((lv - price) * 2) : 0;
					const y = Y(lv);
					return (
						<g key={i}>
							<line x1={250} x2={1700} y1={y} y2={y} stroke={hit ? C.red : C.cyan} strokeOpacity={hit ? 0.25 : 0.45} strokeDasharray="10 10" strokeWidth={2} />
							<g transform={`translate(${1270 + (i % 3) * 140}, ${y}) scale(${hit ? 1 + hf * 0.6 : 1})`} opacity={hit ? 1 - hf : 1}>
								<rect x={-120} y={-26} width={240} height={52} rx={26} fill={hit ? C.red : 'rgba(46,230,255,0.15)'} stroke={hit ? C.red : C.cyan} strokeWidth={2} />
								<text x={0} y={10} fill={hit ? '#fff' : C.cyan} fontSize={26} textAnchor="middle" fontWeight={700} fontFamily={font(lang, 'mono')}>
									{hit ? (lang === 'ta' ? 'லிக்விடேட்!' : 'LIQUIDATED') : `${[10, 20, 25, 50][i % 4]}x · $${lv.toFixed(1)}k`}
								</text>
							</g>
							{hit && hf < 1 ? (
								<text x={1100} y={y + 10 + hf * 40} fill={C.red} fontSize={34} fontWeight={800} opacity={1 - hf} fontFamily={font(lang)}>
									{lang === 'ta' ? 'விற்பனை ↓' : 'SELL ↓'}
								</text>
							) : null}
						</g>
					);
				})}
				<path d={pathOf(trail)} stroke={st >= 1 ? C.red : C.orange} strokeWidth={7} fill="none" style={{filter: `drop-shadow(0 0 10px ${C.red})`}} />
				<circle cx={trail[n][0]} cy={trail[n][1]} r={16} fill="#fff" style={{filter: `drop-shadow(0 0 16px ${C.red})`}} />
				<text x={250} y={110} fill={C.dim} fontSize={28} fontFamily={font(lang, 'mono')} letterSpacing={3}>
					{lang === 'ta' ? 'லிக்விடேஷன் நிலைகள்' : 'LIQUIDATION LEVELS'}
				</text>
			</svg>
		</AbsoluteFill>
	);
};

// a generic token plunging p.pct % and snapping back
export const Plunge: React.FC<SceneProps> = ({p, lang, f, full}) => {
	const u = f / full;
	const pct = p.pct ?? 80;
	const X = (t: number) => lerp(260, 1660, t);
	const pts: [number, number][] = [];
	const k = ease(clamp(u * 1.2));
	for (let i = 0; i <= 300 * k; i++) {
		const t = i / 300;
		let v = 100;
		if (t > 0.35 && t < 0.55) v = 100 - pct * Math.sin(((t - 0.35) / 0.2) * Math.PI / 2);
		else if (t >= 0.55 && t < 0.75) v = 100 - pct + pct * 0.8 * ((t - 0.55) / 0.2);
		else if (t >= 0.75) v = 100 - pct * 0.2;
		v += Math.sin(i * 0.9) * 1.2;
		pts.push([X(t), lerp(800, 220, v / 105)]);
	}
	const last = pts[pts.length - 1] ?? [X(0), 220];
	return (
		<AbsoluteFill>
			<Bg f={f} tint="#2a0b16" />
			<svg width={1920} height={1080} style={{position: 'absolute'}}>
				<line x1={260} x2={1660} y1={lerp(800, 220, 100 / 105)} y2={lerp(800, 220, 100 / 105)} stroke={C.green} strokeDasharray="8 10" strokeOpacity={0.6} strokeWidth={2} />
				<text x={1680} y={lerp(800, 220, 100 / 105) + 8} fill={C.green} fontSize={26} fontFamily={font(lang, 'mono')}>{lang === 'ta' ? 'சாதாரண விலை' : 'normal'}</text>
				<path d={pathOf(pts)} stroke={C.red} strokeWidth={7} fill="none" style={{filter: `drop-shadow(0 0 12px ${C.red})`}} />
				<circle cx={last[0]} cy={last[1]} r={14} fill="#fff" />
				{k > 0.5 ? (
					<text x={X(0.45)} y={lerp(800, 220, (100 - pct) / 105) + 80} fill={C.red} fontSize={90} fontWeight={800} textAnchor="middle"
						fontFamily={font('en', 'mono')} opacity={sp(f, Math.round(full * 0.45))}>−{pct}%</text>
				) : null}
				<text x={260} y={140} fill={C.white} fontSize={lang === 'ta' ? 36 : 42} fontWeight={700} fontFamily={font(lang)}>{tr(p.t, lang)}</text>
			</svg>
		</AbsoluteFill>
	);
};

// one giant candle wick ripping down and snapping back
export const Wick: React.FC<SceneProps> = ({lang, f, full}) => {
	const u = f / full;
	const down = u < 0.45 ? eout(u / 0.45) : 1;
	const back = u > 0.5 ? eout((u - 0.5) / 0.4) : 0;
	const low = 300 + 520 * down;
	const close = 360 + 160 * (1 - back);
	return (
		<AbsoluteFill>
			<Bg f={f} tint="#2a0b16" />
			<svg width={1920} height={1080} style={{position: 'absolute'}}>
				{[0, 1, 2, 3, 4].map((i) => (
					<g key={i} opacity={0.35}>
						<line x1={560 + i * 90} x2={560 + i * 90} y1={250 + rnd(i) * 40} y2={360 + rnd(i + 2) * 40} stroke={C.green} strokeWidth={5} />
						<rect x={540 + i * 90} y={280 + rnd(i) * 40} width={40} height={50} fill={C.green} />
					</g>
				))}
				<line x1={1060} x2={1060} y1={290} y2={low} stroke={C.red} strokeWidth={10} style={{filter: `drop-shadow(0 0 14px ${C.red})`}} />
				<rect x={1020} y={300} width={80} height={close - 300} fill={C.red} rx={6} />
				<text x={1150} y={low} fill={C.red} fontSize={64} fontWeight={800} fontFamily={font('en', 'mono')} opacity={down}>−40 … −80%</text>
				<text x={1150} y={low + 60} fill={C.white} fontSize={38} fontFamily={font(lang)} opacity={down}>{lang === 'ta' ? 'சில நிமிஷங்களில்' : 'in minutes'}</text>
				{back > 0.1 ? <text x={1150} y={360} fill={C.green} fontSize={44} fontWeight={700} fontFamily={font(lang)} opacity={back}>{lang === 'ta' ? '…மீண்டும் மேலே' : '…then snapped back'}</text> : null}
			</svg>
		</AbsoluteFill>
	);
};

// grid of generic altcoin tiles crashing
export const Alts: React.FC<SceneProps> = ({lang, f, full}) => {
	const u = f / full;
	return (
		<AbsoluteFill>
			<Bg f={f} tint="#2a0b16" />
			<Center>
				<div style={{display: 'grid', gridTemplateColumns: 'repeat(6, 230px)', gap: 26, marginTop: -60}}>
					{Array.from({length: 12}).map((_, i) => {
						const drop = Math.round(35 + rnd(i + 4) * 45);
						const t0 = 0.08 + rnd(i) * 0.35;
						const hit = clamp((u - t0) / 0.12);
						const back = clamp((u - t0 - 0.3) / 0.2) * 0.6;
						const cur = Math.round(drop * hit * (1 - back));
						const shake = hit > 0 && hit < 1 ? Math.sin(f * 3 + i) * 6 : 0;
						return (
							<div key={i} style={{height: 220, borderRadius: 22, background: hit > 0 ? 'rgba(255,59,92,0.14)' : C.panel,
								border: `2px solid ${hit > 0 ? C.red : C.line}`, display: 'flex', flexDirection: 'column', alignItems: 'center',
								justifyContent: 'center', gap: 16, transform: `translate(${shake}px, ${hit * 26 * (1 - back)}px)`}}>
								<Coin label={`A${String(i + 1).padStart(2, '0')}`} size={86} color={[C.violet, C.cyan, C.gold, C.green][i % 4]} />
								<div style={{fontFamily: font('en', 'mono'), fontWeight: 800, fontSize: 40, color: cur > 0 ? C.red : C.dim}}>{cur > 0 ? `−${cur}%` : '0%'}</div>
							</div>
						);
					})}
				</div>
			</Center>
			<div style={{position: 'absolute', top: 70, width: '100%', textAlign: 'center'}}>
				<Label lang={lang} size={40} color={C.dim}>{lang === 'ta' ? 'சிறிய காயின்கள் · சில நிமிஷங்களில்' : 'SMALLER COINS · WITHIN MINUTES'}</Label>
			</div>
		</AbsoluteFill>
	);
};

// price bouncing into a wall of sell orders, three times, stepping down
export const SellBounce: React.FC<SceneProps> = ({lang, f, full}) => {
	const u = f / full;
	const pts: [number, number][] = [];
	const k = Math.floor(300 * ease(clamp(u * 1.15)));
	for (let i = 0; i <= k; i++) {
		const t = i / 300;
		const saw = (t * 3) % 1;
		const base = 700 - t * 0 + t * 220;
		const y = base - Math.sin(saw * Math.PI) * 170;
		pts.push([lerp(240, 1500, t), y]);
	}
	const last = pts[pts.length - 1] ?? [240, 700];
	return (
		<AbsoluteFill>
			<Bg f={f} />
			<svg width={1920} height={1080} style={{position: 'absolute'}}>
				{[0, 1, 2].map((j) => {
					const x = lerp(240, 1500, (j + 0.5) / 3);
					const y = 700 + ((j + 0.5) / 3) * 220 - 190;
					const on = clamp((u * 3 - j - 0.3) * 3);
					return (
						<g key={j} opacity={on}>
							<rect x={x - 90} y={y - 70} width={180} height={50} rx={10} fill={C.red} opacity={0.85} />
							<text x={x} y={y - 36} fill="#fff" fontSize={26} textAnchor="middle" fontWeight={700} fontFamily={font(lang, 'mono')}>{lang === 'ta' ? 'விற்பனை' : 'SELL'}</text>
						</g>
					);
				})}
				<path d={pathOf(pts)} stroke={C.orange} strokeWidth={6} fill="none" style={{filter: `drop-shadow(0 0 10px ${C.orange})`}} />
				<circle cx={last[0]} cy={last[1]} r={13} fill="#fff" />
				<g transform="translate(1560, 300)">
					<Coin2 />
				</g>
				<text x={1640} y={520} fill={C.gold} fontSize={34} textAnchor="middle" fontFamily={font(lang)} fontWeight={700}>{lang === 'ta' ? 'பழைய ஹோல்டர்கள்' : 'old holders'}</text>
				<text x={1640} y={565} fill={C.dim} fontSize={30} textAnchor="middle" fontFamily={font(lang)}>{lang === 'ta' ? 'ஒவ்வொரு ஏற்றத்திலும் விற்பனை' : 'sell every bounce'}</text>
			</svg>
		</AbsoluteFill>
	);
};
const Coin2: React.FC = () => (
	<g>
		<circle cx={80} cy={80} r={78} fill={C.gold} opacity={0.2} />
		<circle cx={80} cy={80} r={60} fill="none" stroke={C.gold} strokeWidth={6} />
		<text x={80} y={96} fill={C.gold} fontSize={44} textAnchor="middle" fontWeight={800} fontFamily={font('en', 'mono')}>2011</text>
	</g>
);

// 16:9 thumbnail: the Oct 10 cliff on the right, a big title on the left. p: {lines:[{t, c, s}]}
export const Thumb: React.FC<SceneProps> = ({p, lang}) => (
	<AbsoluteFill>
		<AbsoluteFill style={{transform: 'translateX(820px) translateY(40px) scale(1.25)'}}>
			<Intraday p={{stage: 1}} lang={lang} f={200} full={60} />
		</AbsoluteFill>
		<AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 40%, transparent 62%)'}} />
		<div style={{position: 'absolute', left: 80, top: 120, display: 'flex', flexDirection: 'column', gap: 6}}>
			{(p.lines ?? []).map((l: any, i: number) => (
				<div key={i} style={{fontFamily: font(lang), fontWeight: 700, fontSize: l.s, lineHeight: 1.08, color: l.c, letterSpacing: '-0.02em',
					WebkitTextStroke: '10px #000', paintOrder: 'stroke fill', textShadow: '0 10px 30px rgba(0,0,0,0.9)'}}>{l.t}</div>
			))}
		</div>
	</AbsoluteFill>
);
