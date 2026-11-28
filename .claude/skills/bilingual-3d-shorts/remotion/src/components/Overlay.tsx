import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Overlay as OverlayT, Timeline} from '../types';
import {SevenSeg} from './SevenSeg';
import {Infographic} from './Infographic';

const INFO = new Set(['counter', 'gauge', 'compare', 'scale', 'pin']);

// Glowing floating callout (number / icon / label) that pops on a keyword, like the reference videos.
export const OverlayCallout: React.FC<{ov: OverlayT; style: Timeline['overlayStyle']; fontFamily: string; accent?: string}> = (props) =>
	INFO.has(props.ov.kind) ? <Infographic ov={props.ov} style={props.style} fontFamily={props.fontFamily} /> : <Callout {...props} />;

const Callout: React.FC<{ov: OverlayT; style: Timeline['overlayStyle']; fontFamily: string}> = ({ov, style, fontFamily}) => {
	const f = useCurrentFrame();
	const {fps, height} = useVideoConfig();
	const s = spring({frame: f, fps, config: {damping: 10, stiffness: 180, mass: 0.7}});
	const out = interpolate(f, [ov.dur - 8, ov.dur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const bob = Math.sin(f / 9) * 8;
	const glitch = f < 6 ? (f % 2 === 0 ? 6 : -6) : 0;
	const base: React.CSSProperties = {
		position: 'absolute',
		top: (height * style.yPercent) / 100,
		left: 0,
		right: 0,
		display: 'flex',
		justifyContent: 'center',
		transform: `translate(${glitch}px, calc(-50% + ${bob}px)) scale(${interpolate(s, [0, 1], [0.3, 1])}) rotateX(${interpolate(s, [0, 1], [50, 0])}deg)`,
		opacity: Math.min(1, s * 1.4) * out,
	};

	let content: React.ReactNode;
	if (ov.seg) {
		content = <SevenSeg text={ov.text} mode={ov.seg} dur={ov.dur} size={style.size} />;
	} else if (ov.kind === 'number') {
		content = (
			<div
				style={{
					fontFamily: 'Inter, sans-serif',
					fontWeight: 900,
					fontSize: style.size,
					lineHeight: 1,
					background: 'linear-gradient(180deg, #ffffff 0%, #cfd8dc 45%, #7b8c94 55%, #eef3f5 100%)',
					WebkitBackgroundClip: 'text',
					backgroundClip: 'text',
					color: 'transparent',
					filter: `drop-shadow(0 0 18px ${ov.color}) drop-shadow(0 10px 20px rgba(0,0,0,0.6))`,
				}}
			>
				{ov.text}
			</div>
		);
	} else if (ov.kind === 'icon') {
		content = (
			<div
				style={{
					fontSize: style.size * 0.9,
					lineHeight: 1,
					color: ov.color,
					filter: `drop-shadow(0 0 22px rgba(125,249,255,0.9)) drop-shadow(0 10px 20px rgba(0,0,0,0.6))`,
				}}
			>
				{ov.text}
			</div>
		);
	} else if (ov.kind === 'hook') {
		// Hook title (frame 0 until the spoken hook lands): big, high-contrast, readable with the sound off.
		content = (
			<div
				style={{
					fontFamily,
					fontWeight: 900,
					fontSize: style.size * 0.4,
					lineHeight: 1.12,
					maxWidth: '86%',
					textAlign: 'center',
					color: '#ffffff',
					padding: '20px 40px',
					borderRadius: 28,
					background: 'rgba(0, 0, 0, 0.55)',
					border: `5px solid ${ov.color}`,
					boxShadow: `0 0 30px ${ov.color}88, 0 12px 30px rgba(0,0,0,0.6)`,
					textShadow: '0 4px 12px rgba(0,0,0,0.8)',
				}}
			>
				{ov.text}
			</div>
		);
	} else {
		content = (
			<div
				style={{
					fontFamily,
					fontWeight: 800,
					fontSize: style.size * 0.32,
					color: '#ffffff',
					padding: '18px 38px',
					borderRadius: 999,
					border: `4px solid ${ov.color}`,
					background: 'rgba(4, 30, 38, 0.55)',
					boxShadow: `0 0 28px ${ov.color}, inset 0 0 18px rgba(125,249,255,0.35)`,
					textShadow: '0 3px 10px rgba(0,0,0,0.7)',
				}}
			>
				{ov.text}
			</div>
		);
	}

	return (
		<AbsoluteFill style={{perspective: 900}}>
			<div style={base}>{content}</div>
		</AbsoluteFill>
	);
};
