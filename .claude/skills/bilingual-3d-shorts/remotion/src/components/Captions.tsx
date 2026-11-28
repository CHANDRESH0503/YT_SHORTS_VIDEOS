import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {fitText} from '@remotion/layout-utils';
import type {Caption, Timeline} from '../types';

export const Captions: React.FC<{captions: Caption[]; style: Timeline['captionStyle']; fontFamily: string}> = ({
	captions,
	style,
	fontFamily,
}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const active = captions.find((c) => frame >= c.from && frame < c.to);
	const maxWidth = (width * style.maxWidthPercent) / 100;

	const fontSize = useMemo(() => {
		if (!active) return style.size;
		try {
			const fit = fitText({text: active.text, withinWidth: maxWidth, fontFamily, fontWeight: style.weight});
			return Math.min(style.size, fit.fontSize);
		} catch {
			return style.size;
		}
	}, [active, maxWidth, fontFamily, style.size, style.weight]);

	if (!active) return null;
	const local = frame - active.from;
	const pop = spring({frame: local, fps, config: {damping: 13, stiffness: 220, mass: 0.6}});
	const scale = interpolate(pop, [0, 1], [0.78, 1]);
	const lift = interpolate(pop, [0, 1], [22, 0]);
	const fadeOut = interpolate(frame, [active.to - 4, active.to], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div
				style={{
					position: 'absolute',
					top: (height * style.yPercent) / 100,
					left: 0,
					right: 0,
					display: 'flex',
					justifyContent: 'center',
					transform: `translateY(calc(-50% + ${lift}px)) scale(${scale})`,
					opacity: fadeOut,
				}}
			>
				<div
					style={{
						maxWidth,
						textAlign: 'center',
						fontFamily,
						fontWeight: style.weight as React.CSSProperties['fontWeight'],
						fontSize,
						lineHeight: 1.25,
						color: style.color,
						WebkitTextStroke: `${style.stroke}px rgba(0,0,0,0.92)`,
						paintOrder: 'stroke fill',
						textShadow: style.shadow,
						letterSpacing: '-0.01em',
					}}
				>
					{active.words.map((w, i) => {
						const on = frame >= w.from && frame < Math.max(w.to, w.from + 4);
						// the spoken word turns yellow and pops 8% (springs in over ~4 frames)
						const wp = on ? spring({frame: frame - w.from, fps, config: {damping: 12, stiffness: 260, mass: 0.5}}) : 0;
						const ws = on ? interpolate(wp, [0, 1], [1.0, 1.08]) : 1;
						return (
							<span
								key={i}
								style={{
									color: on ? style.highlight : style.color,
									display: 'inline-block',
									transform: `scale(${ws})`,
									marginRight: i < active.words.length - 1 ? '0.26em' : 0,
								}}
							>
								{w.text}
							</span>
						);
					})}
				</div>
			</div>
		</AbsoluteFill>
	);
};
