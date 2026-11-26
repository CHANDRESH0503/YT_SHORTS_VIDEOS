import React from 'react';
import {useCurrentFrame} from 'remotion';

// Accurate, code-drawn seven-segment glyphs (AI stills can't draw these reliably).
// modes: digits (segments light one by one), labels (an 8 with a-g names), scan (multiplexing demo).
export type SegMode = 'digits' | 'labels' | 'scan';

const SEGS = ['a', 'b', 'c', 'd', 'e', 'f', 'g'] as const;
type Seg = (typeof SEGS)[number];
export const DIGIT_SEGS: Record<string, Seg[]> = {
	'0': ['a', 'b', 'c', 'd', 'e', 'f'],
	'1': ['b', 'c'],
	'2': ['a', 'b', 'd', 'e', 'g'],
	'3': ['a', 'b', 'c', 'd', 'g'],
	'4': ['b', 'c', 'f', 'g'],
	'5': ['a', 'c', 'd', 'f', 'g'],
	'6': ['a', 'c', 'd', 'e', 'f', 'g'],
	'7': ['a', 'b', 'c'],
	'8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
	'9': ['a', 'b', 'c', 'd', 'f', 'g'],
};

const W = 120;
const H = 220;
const T = 24;
const GAP = 5;

function hseg(xa: number, xb: number, y: number) {
	const h = T / 2;
	return `${xa},${y} ${xa + h},${y - h} ${xb - h},${y - h} ${xb},${y} ${xb - h},${y + h} ${xa + h},${y + h}`;
}
function vseg(x: number, ya: number, yb: number) {
	const h = T / 2;
	return `${x},${ya} ${x + h},${ya + h} ${x + h},${yb - h} ${x},${yb} ${x - h},${yb - h} ${x - h},${ya + h}`;
}
const x0 = T / 2;
const x1 = W - T / 2;
const y0 = T / 2;
const ym = H / 2;
const y1 = H - T / 2;
const POLY: Record<Seg, string> = {
	a: hseg(x0 + GAP, x1 - GAP, y0),
	b: vseg(x1, y0 + GAP, ym - GAP),
	c: vseg(x1, ym + GAP, y1 - GAP),
	d: hseg(x0 + GAP, x1 - GAP, y1),
	e: vseg(x0, ym + GAP, y1 - GAP),
	f: vseg(x0, y0 + GAP, ym - GAP),
	g: hseg(x0 + GAP, x1 - GAP, ym),
};
const LABEL_POS: Record<Seg, [number, number]> = {
	a: [W / 2, -26],
	b: [W + 30, ym / 2 + 6],
	c: [W + 30, ym + ym / 2 + 6],
	d: [W / 2, H + 46],
	e: [-30, ym + ym / 2 + 6],
	f: [-30, ym / 2 + 6],
	g: [W / 2, ym - 22],
};

const LIT = '#FF3B30';
const OFF = 'rgba(255, 70, 60, 0.09)';

const Digit: React.FC<{lit: Set<Seg>; x: number; labels?: boolean; labelFrom?: number; frame: number}> = ({lit, x, labels, labelFrom = 0, frame}) => (
	<g transform={`translate(${x},0) skewX(-6)`}>
		{SEGS.map((s) => (
			<polygon
				key={s}
				points={POLY[s]}
				fill={lit.has(s) ? LIT : OFF}
				stroke={lit.has(s) ? '#FFB3AE' : 'rgba(255,120,110,0.18)'}
				strokeWidth={lit.has(s) ? 1.5 : 1}
				style={lit.has(s) ? {filter: 'url(#segGlow)'} : undefined}
			/>
		))}
		{labels
			? SEGS.map((s, i) => {
					const on = frame >= labelFrom + i * 3;
					return on ? (
						<text
							key={`l${s}`}
							x={LABEL_POS[s][0]}
							y={LABEL_POS[s][1]}
							textAnchor="middle"
							fontFamily="Inter, sans-serif"
							fontWeight={900}
							fontSize={40}
							fill="#7DF9FF"
							style={{filter: 'drop-shadow(0 0 8px rgba(125,249,255,0.9))'}}
						>
							{s.toUpperCase()}
						</text>
					) : null;
			  })
			: null}
	</g>
);

export const SevenSeg: React.FC<{text: string; mode: SegMode; dur: number; size: number}> = ({text, mode, dur, size}) => {
	const frame = useCurrentFrame();
	const digits = (text.replace(/[^0-9]/g, '') || '8').split('');
	const n = digits.length;
	const pitch = W + 46;
	const padX = mode === 'labels' ? 70 : 40;
	const vbW = n * pitch - 46 + padX * 2;
	const vbH = H + (mode === 'labels' ? 150 : 80);
	const offY = mode === 'labels' ? 66 : 40;

	// which segments are lit for each digit at this frame
	let litFor: (i: number) => Set<Seg>;
	if (mode === 'scan') {
		// multiplexing: one digit at a time, accelerating, then fused into a steady display
		const scanEnd = Math.floor(dur * 0.72);
		const order: number[] = [];
		let f = 0;
		let idx = 0;
		while (f < scanEnd) {
			const step = Math.max(1, Math.round(11 * Math.pow(1 - f / scanEnd, 1.6)));
			for (let k = 0; k < step && f < scanEnd; k++, f++) order.push(idx);
			idx = (idx + 1) % n;
		}
		const active = frame < scanEnd ? order[frame] : -1;
		litFor = (i) => (active === -1 || active === i ? new Set(DIGIT_SEGS[digits[i]]) : new Set());
	} else {
		// segments switch on one by one (a..g order filtered to the digit)
		litFor = (i) => {
			const segs = DIGIT_SEGS[digits[i]];
			const k = Math.floor((frame - i * 4) / 3) + 1;
			return new Set(segs.slice(0, Math.max(0, k)));
		};
	}

	const px = (size / 260) * 1.55;
	return (
		<div
			style={{
				padding: '26px 30px',
				borderRadius: 36,
				background: 'linear-gradient(180deg, rgba(6,18,22,0.86), rgba(2,8,10,0.92))',
				border: '3px solid rgba(125,249,255,0.55)',
				boxShadow: '0 0 34px rgba(0,180,200,0.55), inset 0 0 26px rgba(125,249,255,0.12), 0 18px 40px rgba(0,0,0,0.6)',
			}}
		>
			<svg width={vbW * px * 0.95} height={vbH * px * 0.95} viewBox={`0 0 ${vbW} ${vbH}`}>
				<defs>
					<filter id="segGlow" x="-50%" y="-50%" width="200%" height="200%">
						<feGaussianBlur stdDeviation="6" result="b" />
						<feMerge>
							<feMergeNode in="b" />
							<feMergeNode in="b" />
							<feMergeNode in="SourceGraphic" />
						</feMerge>
					</filter>
				</defs>
				<g transform={`translate(${padX},${offY})`}>
					{digits.map((d, i) => (
						<Digit key={i} lit={litFor(i)} x={i * pitch} labels={mode === 'labels'} labelFrom={10} frame={frame} />
					))}
				</g>
			</svg>
		</div>
	);
};
