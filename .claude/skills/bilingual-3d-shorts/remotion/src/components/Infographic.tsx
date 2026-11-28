import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Overlay, Timeline} from '../types';

// Kinetic infographics that move on the spoken word: counter, gauge, compare, scale, pin (pinned to a 3D point).
// Motion rules: spring in with overshoot, values run over the first ~55% (timeline.py places ticks there), settle, fade out.
// One accent colour per video (timeline accent / grade preset); white for everything else.

const RUN = 0.55;
const glass: React.CSSProperties = {
	background: 'linear-gradient(180deg, rgba(10,22,28,0.72) 0%, rgba(4,12,16,0.62) 100%)',
	border: '2px solid rgba(255,255,255,0.16)',
	borderRadius: 34,
	boxShadow: '0 18px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12)',
	backdropFilter: 'blur(6px)',
};
const shadowText = '0 4px 14px rgba(0,0,0,0.75)';

const fmt = (v: number, decimals = 0) =>
	v.toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals});

export const Infographic: React.FC<{ov: Overlay; style: Timeline['overlayStyle']; fontFamily: string}> = ({ov, style, fontFamily}) => {
	const f = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const d = ov.data ?? {};
	const acc = ov.color;
	const pop = spring({frame: f, fps, config: {damping: 11, stiffness: 170, mass: 0.75}});
	const out = interpolate(f, [ov.dur - 9, ov.dur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const run = interpolate(f, [4, Math.max(5, ov.dur * RUN)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.exp)});
	// settle bump when the value lands
	const land = spring({frame: f - Math.round(ov.dur * RUN), fps, config: {damping: 8, stiffness: 260, mass: 0.5}});
	const bump = f > ov.dur * RUN ? 1 + 0.06 * Math.sin(Math.PI * Math.min(1, land)) : 1;
	const top = (height * style.yPercent) / 100;
	const wrap = (child: React.ReactNode, extra?: React.CSSProperties) => (
		<AbsoluteFill style={{perspective: 900}}>
			<div
				style={{
					position: 'absolute', top, left: 0, right: 0, display: 'flex', justifyContent: 'center',
					transform: `translateY(-50%) scale(${interpolate(pop, [0, 1], [0.55, 1]) * bump}) rotateX(${interpolate(pop, [0, 1], [35, 0])}deg)`,
					opacity: Math.min(1, pop * 1.5) * out, fontFamily, ...extra,
				}}
			>
				{child}
			</div>
		</AbsoluteFill>
	);
	const label = (txt?: string, size = 46) =>
		txt ? <div style={{fontWeight: 800, fontSize: size, color: '#fff', textShadow: shadowText, letterSpacing: 1, textAlign: 'center'}}>{txt}</div> : null;

	if (ov.kind === 'counter') {
		const v0 = d.from ?? 0;
		const v1 = d.to ?? 0;
		const v = v0 + (v1 - v0) * run;
		return wrap(
			<div style={{...glass, padding: '26px 54px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4}}>
				{label(ov.text, 44)}
				<div style={{display: 'flex', alignItems: 'baseline', gap: 14}}>
					<span
						style={{
							fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: style.size * 0.78, lineHeight: 1, color: '#fff',
							fontVariantNumeric: 'tabular-nums', textShadow: `0 0 26px ${acc}, ${shadowText}`,
						}}
					>
						{(d.prefix ?? '') + fmt(v, d.decimals ?? 0)}
					</span>
					{d.unit ? <span style={{fontWeight: 900, fontSize: style.size * 0.3, color: acc, textShadow: shadowText}}>{d.unit}</span> : null}
				</div>
			</div>,
		);
	}

	if (ov.kind === 'gauge') {
		const max = d.max ?? 100;
		const k = Math.max(0, Math.min(1, ((d.value ?? 0) / max) * run));
		const R = 190;
		const arc = Math.PI * R;
		// needle overshoots and settles (spring past the eased run)
		const needle = Math.min(1.04, k + (f > ov.dur * RUN ? 0.05 * Math.sin(Math.PI * Math.min(1, land)) : 0));
		const ang = -90 + 180 * needle;
		return wrap(
			<div style={{...glass, padding: '30px 46px 26px', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
				<svg width={2 * R + 60} height={R + 50} viewBox={`${-R - 30} ${-R - 20} ${2 * R + 60} ${R + 50}`}>
					<defs>
						<filter id="gglow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8" /></filter>
					</defs>
					<path d={`M ${-R} 0 A ${R} ${R} 0 0 1 ${R} 0`} stroke="rgba(255,255,255,0.16)" strokeWidth={34} fill="none" strokeLinecap="round" />
					<path d={`M ${-R} 0 A ${R} ${R} 0 0 1 ${R} 0`} stroke={acc} strokeWidth={34} fill="none" strokeLinecap="round"
						strokeDasharray={`${arc * k} ${arc}`} filter="url(#gglow)" opacity={0.8} />
					<path d={`M ${-R} 0 A ${R} ${R} 0 0 1 ${R} 0`} stroke={acc} strokeWidth={30} fill="none" strokeLinecap="round" strokeDasharray={`${arc * k} ${arc}`} />
					{Array.from({length: 11}, (_, i) => {
						const a = Math.PI * (1 - i / 10);
						return <line key={i} x1={Math.cos(a) * (R - 34)} y1={-Math.sin(a) * (R - 34)} x2={Math.cos(a) * (R - 52)} y2={-Math.sin(a) * (R - 52)} stroke="rgba(255,255,255,0.5)" strokeWidth={4} />;
					})}
					<g transform={`rotate(${ang})`}>
						<line x1={0} y1={0} x2={0} y2={-(R - 46)} stroke="#fff" strokeWidth={9} strokeLinecap="round" />
					</g>
					<circle r={16} fill="#fff" />
				</svg>
				<div style={{display: 'flex', alignItems: 'baseline', gap: 10, marginTop: -6}}>
					<span style={{fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 92, color: '#fff', fontVariantNumeric: 'tabular-nums', textShadow: `0 0 22px ${acc}`}}>
						{fmt((d.value ?? 0) * run, d.decimals ?? 0)}
					</span>
					{d.unit ? <span style={{fontWeight: 900, fontSize: 48, color: acc}}>{d.unit}</span> : null}
				</div>
				{label(ov.text || d.label, 40)}
			</div>,
		);
	}

	if (ov.kind === 'compare') {
		const items = d.items ?? [];
		const vmax = Math.max(1e-9, ...items.map((i) => i.value));
		const best = items.reduce((a, b, i) => (b.value > items[a].value ? i : a), 0);
		const W = 640;
		return wrap(
			<div style={{...glass, padding: '30px 40px', width: W + 80, display: 'flex', flexDirection: 'column', gap: 22}}>
				{label(ov.text, 42)}
				{items.map((it, i) => {
					const g = interpolate(f, [6 + i * 6, 6 + i * 6 + ov.dur * RUN * 0.8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.4))});
					const col = i === best ? acc : 'rgba(255,255,255,0.85)';
					return (
						<div key={i} style={{display: 'flex', flexDirection: 'column', gap: 8}}>
							<div style={{display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 40, color: '#fff', textShadow: shadowText}}>
								<span>{it.label}</span>
								<span style={{color: col, fontVariantNumeric: 'tabular-nums'}}>{fmt(it.value * Math.min(1, g), d.decimals ?? 0)}{d.unit ?? ''}</span>
							</div>
							<div style={{height: 30, borderRadius: 16, background: 'rgba(255,255,255,0.12)', overflow: 'hidden'}}>
								<div style={{height: '100%', width: `${(it.value / vmax) * 100 * g}%`, borderRadius: 16, background: col, boxShadow: `0 0 20px ${col}`}} />
							</div>
						</div>
					);
				})}
			</div>,
		);
	}

	if (ov.kind === 'scale') {
		const L = 560;
		const draw = run;
		return wrap(
			<div style={{...glass, padding: '24px 44px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
				<div style={{fontWeight: 900, fontSize: 76, color: '#fff', textShadow: `0 0 18px ${acc}, ${shadowText}`}}>{ov.text}</div>
				<svg width={L + 20} height={60} viewBox={`-10 -30 ${L + 20} 60`}>
					<line x1={0} y1={0} x2={L * draw} y2={0} stroke={acc} strokeWidth={10} strokeLinecap="round" style={{filter: `drop-shadow(0 0 8px ${acc})`}} />
					{Array.from({length: 11}, (_, i) => (i / 10 <= draw + 1e-6 ? (
						<line key={i} x1={(L * i) / 10} y1={i % 5 === 0 ? -24 : -12} x2={(L * i) / 10} y2={0} stroke="#fff" strokeWidth={i % 5 === 0 ? 6 : 4} strokeLinecap="round" />
					) : null))}
				</svg>
			</div>,
		);
	}

	// pin: a dot on the 3D point (track from film.js pin(), per frame) + a leader line + a label pill
	const tr = d.track && d.track.length ? d.track[Math.min(d.track.length - 1, Math.max(0, f))] : null;
	const ax = (tr ? tr[1] : d.at?.[0] ?? 0.5) * width;
	const ay = (tr ? tr[2] : d.at?.[1] ?? 0.45) * height;
	const vis = tr ? tr[3] : 1;
	const right = ax < width * 0.5;
	const lx = Math.max(220, Math.min(width - 220, ax + (right ? 300 : -300)));
	const ly = Math.max(height * 0.14, Math.min(height * 0.6, ay - 320));   // stay above the caption zone
	const line = interpolate(f, [3, 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
	const ring = (f % 30) / 30;
	return (
		<AbsoluteFill style={{opacity: out * (vis ? 1 : 0)}}>
			<svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
				<line x1={ax} y1={ay} x2={ax + (lx - ax) * line} y2={ay + (ly - ay) * line} stroke="#fff" strokeWidth={6} strokeLinecap="round" style={{filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.7))'}} />
				<circle cx={ax} cy={ay} r={12 * pop} fill={acc} style={{filter: `drop-shadow(0 0 10px ${acc})`}} />
				<circle cx={ax} cy={ay} r={14 + 30 * ring} fill="none" stroke={acc} strokeWidth={4} opacity={1 - ring} />
			</svg>
			<div
				style={{
					position: 'absolute', left: lx, top: ly, transform: `translate(-50%, -50%) scale(${interpolate(pop, [0, 1], [0.4, 1])})`,
					...glass, borderRadius: 999, border: `5px solid ${acc}`, padding: '18px 42px',
					fontFamily, fontWeight: 900, fontSize: 62, color: '#fff', textShadow: shadowText, whiteSpace: 'nowrap',
					opacity: Math.min(1, pop * 1.5),
				}}
			>
				{ov.text}
			</div>
		</AbsoluteFill>
	);
};
