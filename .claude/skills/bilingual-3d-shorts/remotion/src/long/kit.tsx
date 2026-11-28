// Shared look for the 16:9 long-form motion-graphics scenes: palette, fonts, easing, background, small primitives.
import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring} from 'remotion';
import {loadFont as loadGrotesk} from '@remotion/google-fonts/SpaceGrotesk';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadTamil} from '@remotion/google-fonts/NotoSansTamil';

const grotesk = loadGrotesk('normal', {weights: ['500', '700'], subsets: ['latin']});
const mono = loadMono('normal', {weights: ['500', '800'], subsets: ['latin']});
const inter = loadInter('normal', {weights: ['600', '800', '900'], subsets: ['latin']});
const tamil = loadTamil('normal', {weights: ['600', '700', '800'], subsets: ['tamil']});

export type Lang = 'en' | 'ta';
export type L = {en: string; ta: string};
export type SceneProps = {p: any; lang: Lang; f: number; full: number};

export const C = {
	bg0: '#05080F',
	bg1: '#0B1630',
	grid: 'rgba(90,170,255,0.07)',
	orange: '#F7931A',
	cyan: '#2EE6FF',
	green: '#23E59A',
	red: '#FF3B5C',
	gold: '#FFC94A',
	violet: '#9B7BFF',
	white: '#EAF2FF',
	dim: '#7C8BA8',
	panel: 'rgba(14,26,52,0.82)',
	line: 'rgba(120,170,255,0.25)',
};

export const font = (lang: Lang, kind: 'head' | 'mono' | 'body' = 'head') => {
	const t = tamil.fontFamily;
	if (kind === 'mono') return `${mono.fontFamily}, ${t}`;
	if (kind === 'body') return lang === 'ta' ? `${t}, ${inter.fontFamily}` : inter.fontFamily;
	return lang === 'ta' ? `${t}, ${grotesk.fontFamily}` : `${grotesk.fontFamily}, ${inter.fontFamily}`;
};

export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const ease = (x: number) => Easing.bezier(0.45, 0, 0.2, 1)(clamp(x));
export const eout = (x: number) => Easing.out(Easing.cubic)(clamp(x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const range = (f: number, a: number, b: number) => clamp((f - a) / Math.max(1, b - a));
export const sp = (f: number, delay = 0, damping = 13, stiffness = 140, mass = 0.8) =>
	spring({frame: f - delay, fps: 30, config: {damping, stiffness, mass}});
export const fadeIn = (f: number, a: number, len = 8) => interpolate(f, [a, a + len], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
export const rnd = (i: number) => {
	const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
	return x - Math.floor(x);
};
export const tr = (v: L | string | undefined, lang: Lang) => (v == null ? '' : typeof v === 'string' ? v : v[lang] ?? v.en);
export const fmt = (n: number, dec = 0) =>
	n.toLocaleString('en-US', {minimumFractionDigits: dec, maximumFractionDigits: dec});

// moving terminal background: radial glow, drifting grid, floating dust
export const Bg: React.FC<{f: number; tint?: string; grid?: boolean}> = ({f, tint = C.bg1, grid = true}) => (
	<AbsoluteFill>
		<AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 40%, ${tint} 0%, ${C.bg0} 70%)`}} />
		{grid ? (
			<AbsoluteFill
				style={{
					backgroundImage: `linear-gradient(${C.grid} 1.5px, transparent 1.5px), linear-gradient(90deg, ${C.grid} 1.5px, transparent 1.5px)`,
					backgroundSize: '80px 80px',
					backgroundPosition: `${-f * 0.6}px ${-f * 0.35}px`,
					maskImage: 'radial-gradient(ellipse at 50% 45%, black 30%, transparent 85%)',
				}}
			/>
		) : null}
		{Array.from({length: 26}).map((_, i) => {
			const x = (rnd(i) * 1920 + f * (0.3 + rnd(i + 9) * 0.6)) % 1960 - 20;
			const y = (rnd(i + 3) * 1080 - f * (0.15 + rnd(i + 5) * 0.3) + 2000) % 1080;
			const s = 2 + rnd(i + 7) * 3;
			return (
				<div
					key={i}
					style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: s, background: C.cyan,
						opacity: 0.12 + 0.18 * rnd(i + 11), boxShadow: `0 0 ${s * 3}px ${C.cyan}`}}
				/>
			);
		})}
	</AbsoluteFill>
);

export const Center: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
	<AbsoluteFill style={{display: 'flex', alignItems: 'center', justifyContent: 'center', ...style}}>{children}</AbsoluteFill>
);

export const glow = (c: string, r = 24) => `0 0 ${r}px ${c}, 0 0 ${r * 2}px ${c}55`;

// a generic coin: ring + ticker letters (no logos)
export const Coin: React.FC<{label: string; color?: string; size?: number; style?: React.CSSProperties; dim?: number}> = ({
	label,
	color = C.orange,
	size = 120,
	style,
	dim = 1,
}) => (
	<div
		style={{
			width: size,
			height: size,
			borderRadius: '50%',
			background: `radial-gradient(circle at 35% 30%, ${color} 0%, ${color}cc 45%, ${color}66 100%)`,
			border: `${Math.max(3, size * 0.06)}px solid ${color}`,
			boxShadow: `0 0 ${size * 0.35}px ${color}88, inset 0 -${size * 0.08}px ${size * 0.15}px rgba(0,0,0,0.35), inset 0 ${size * 0.06}px ${size * 0.1}px rgba(255,255,255,0.35)`,
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			color: '#1a0d00',
			fontFamily: font('en', 'mono'),
			fontWeight: 800,
			fontSize: size * (label.length > 3 ? 0.22 : 0.28),
			letterSpacing: '-0.02em',
			opacity: dim,
			...style,
		}}
	>
		{label}
	</div>
);

export const Panel: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
	<div
		style={{
			background: C.panel,
			border: `2px solid ${C.line}`,
			borderRadius: 26,
			boxShadow: '0 30px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
			backdropFilter: 'blur(6px)',
			...style,
		}}
	>
		{children}
	</div>
);

export const Label: React.FC<{children: React.ReactNode; lang: Lang; size?: number; color?: string; style?: React.CSSProperties; weight?: number}> = ({
	children,
	lang,
	size = 44,
	color = C.white,
	style,
	weight = 700,
}) => (
	<div style={{fontFamily: font(lang), fontWeight: weight, fontSize: lang === 'ta' ? size * 0.82 : size, color, lineHeight: 1.15, ...style}}>
		{children}
	</div>
);

// tiny stick person (faceless trader)
export const Person: React.FC<{x: number; y: number; s?: number; color?: string; o?: number; arms?: number}> = ({x, y, s = 1, color = C.cyan, o = 1, arms = 0}) => (
	<g transform={`translate(${x},${y}) scale(${s})`} opacity={o}>
		<circle cx={0} cy={-62} r={14} fill="none" stroke={color} strokeWidth={5} />
		<line x1={0} y1={-48} x2={0} y2={-12} stroke={color} strokeWidth={5} strokeLinecap="round" />
		<line x1={0} y1={-38} x2={-16} y2={-22 - arms} stroke={color} strokeWidth={5} strokeLinecap="round" />
		<line x1={0} y1={-38} x2={16} y2={-22 - arms} stroke={color} strokeWidth={5} strokeLinecap="round" />
		<line x1={0} y1={-12} x2={-12} y2={14} stroke={color} strokeWidth={5} strokeLinecap="round" />
		<line x1={0} y1={-12} x2={12} y2={14} stroke={color} strokeWidth={5} strokeLinecap="round" />
	</g>
);

// ---- the 2025 BTC price path (USD thousands). Anchors are approximate closes; labelled values come from research.md.
const A: [number, number][] = [
	[0, 93.4], [19, 106], [30, 102], [40, 97], [51, 98], [58, 84], [68, 79], [89, 82], [96, 74.5], [111, 93],
	[141, 111], [155, 101], [180, 107], [194, 122], [211, 116], [225, 124], [242, 108], [267, 109], [278, 126.2],
	[281, 121.5], [282.86, 121.0], [282.9, 117], [282.92, 104.8], [282.95, 109], [283.1, 112], [284, 113],
	[299, 115], [307, 101], [317, 94], [321, 89.6], [324, 84], [334, 87], [343, 92], [351, 85], [364, 87.5],
];
export const dayOf = (md: string) => {
	const [m, d] = md.split('-').map(Number);
	return Math.round((Date.UTC(2025, m - 1, d) - Date.UTC(2025, 0, 1)) / 86400000);
};
export const btc = (d: number) => {
	if (d <= A[0][0]) return A[0][1];
	for (let i = 0; i < A.length - 1; i++) {
		const [d0, v0] = A[i];
		const [d1, v1] = A[i + 1];
		if (d <= d1) {
			const t = (d - d0) / (d1 - d0);
			const s = t * t * (3 - 2 * t);
			const base = v0 + (v1 - v0) * s;
			const span = d1 - d0;
			const wob = span > 3 ? Math.sin(Math.PI * t) * (Math.sin(d * 0.9) * 0.010 + Math.sin(d * 2.3 + 1) * 0.005 + Math.sin(d * 6.1 + 2) * 0.0015) : 0;
			return base * (1 + wob);
		}
	}
	return A[A.length - 1][1];
};
export const MONTHS = {en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
	ta: ['ஜன', 'பிப்', 'மார்', 'ஏப்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆக', 'செப்', 'அக்', 'நவ', 'டிச']};
export const monthStart = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
