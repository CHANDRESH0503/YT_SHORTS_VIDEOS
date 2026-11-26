import React from 'react';
import {AbsoluteFill, Easing, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import type {Move, Segment, Transition} from '../types';

const IN_FRAMES = 7;
const OUT_FRAMES = 5;
const ease = Easing.bezier(0.33, 0, 0.67, 1);

// 2.5D camera move over the shot (p: 0..1). Returns CSS transform for the image layer.
const moveTransform = (move: Move, p: number, f: number): string => {
	const lerp = (a: number, b: number) => a + (b - a) * p;
	// subtle handheld drift so nothing ever sits perfectly still
	const hx = 3 * Math.sin(f / 7) + 2 * Math.sin(f / 13 + 1.3);
	const hy = 2 * Math.sin(f / 11 + 0.7);
	let s = 1.14;
	let x = 0;
	let y = 0;
	let ry = 0;
	let rz = 0;
	switch (move) {
		case 'push_in':
			s = lerp(1.06, 1.24);
			break;
		case 'pull_out':
			s = lerp(1.24, 1.06);
			break;
		case 'pan_left':
			s = 1.2;
			x = lerp(70, -70);
			break;
		case 'pan_right':
			s = 1.2;
			x = lerp(-70, 70);
			break;
		case 'tilt_up':
			s = 1.2;
			y = lerp(-90, 90);
			break;
		case 'tilt_down':
			s = 1.2;
			y = lerp(90, -90);
			break;
		case 'orbit_left':
			s = lerp(1.26, 1.2);
			x = lerp(60, -60);
			ry = lerp(5, -5);
			rz = lerp(0.8, -0.8);
			break;
		case 'orbit_right':
			s = lerp(1.26, 1.2);
			x = lerp(-60, 60);
			ry = lerp(-5, 5);
			rz = lerp(-0.8, 0.8);
			break;
		case 'static_drift':
		default:
			s = lerp(1.12, 1.16);
	}
	return `perspective(1600px) translate(${x + hx}px, ${y + hy}px) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${s})`;
};

type Fx = {transform: string; blur: number; flash: number};

const transitionIn = (t: Transition, f: number, width: number): Fx => {
	const k = interpolate(f, [0, IN_FRAMES], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
	switch (t) {
		case 'whip_left':
			return {transform: `translateX(${k * width * 0.38}px)`, blur: k * 34, flash: 0};
		case 'whip_right':
			return {transform: `translateX(${-k * width * 0.38}px)`, blur: k * 34, flash: 0};
		case 'zoom':
			return {transform: `scale(${1 + k * 0.38})`, blur: k * 22, flash: 0};
		case 'flash': {
			const fl = interpolate(f, [0, 9], [1, 0], {extrapolateRight: 'clamp'});
			return {transform: `scale(${1 + k * 0.1})`, blur: 0, flash: fl};
		}
		case 'punch': {
			const kp = interpolate(f, [0, 4], [1, 0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});
			return {transform: `scale(${1 + kp * 0.14})`, blur: 0, flash: 0};
		}
		default:
			return {transform: '', blur: 0, flash: 0};
	}
};

const transitionOut = (next: Transition | undefined, f: number, dur: number, width: number): Fx => {
	const k = interpolate(f, [dur - OUT_FRAMES, dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
	switch (next) {
		case 'whip_left':
			return {transform: `translateX(${-k * width * 0.38}px)`, blur: k * 34, flash: 0};
		case 'whip_right':
			return {transform: `translateX(${k * width * 0.38}px)`, blur: k * 34, flash: 0};
		case 'zoom':
			return {transform: `scale(${1 + k * 0.45})`, blur: k * 22, flash: 0};
		case 'flash':
			return {transform: '', blur: 0, flash: k * 0.9};
		default:
			return {transform: '', blur: 0, flash: 0};
	}
};

export const Shot: React.FC<{seg: Segment; next?: Transition; width: number}> = ({seg, next, width}) => {
	const f = useCurrentFrame();
	const p = interpolate(f, [0, Math.max(1, seg.dur - 1)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
	const tin = transitionIn(seg.transition, f, width);
	const tout = transitionOut(next, f, seg.dur, width);
	const blur = tin.blur + tout.blur;
	const flash = Math.max(tin.flash, tout.flash);
	const clipScale = interpolate(f, [0, seg.dur], [1.02, 1.07]);

	return (
		<AbsoluteFill style={{overflow: 'hidden', backgroundColor: '#04161c'}}>
			<AbsoluteFill style={{transform: `${tin.transform} ${tout.transform}`, filter: blur > 0.5 ? `blur(${blur}px)` : undefined}}>
				<AbsoluteFill style={{transform: moveTransform(seg.move, p, f)}}>
					<Img src={staticFile(seg.image)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
				</AbsoluteFill>
				{seg.clip ? (
					<Sequence durationInFrames={Math.max(1, seg.clip.frames)} layout="none">
						<AbsoluteFill style={{transform: `scale(${clipScale})`}}>
							<OffthreadVideo
								src={staticFile(seg.clip.src)}
								muted
								startFrom={seg.clip.startFrom}
								playbackRate={seg.clip.playbackRate}
								style={{width: '100%', height: '100%', objectFit: 'cover'}}
							/>
						</AbsoluteFill>
					</Sequence>
				) : null}
			</AbsoluteFill>
			{flash > 0.01 ? <AbsoluteFill style={{backgroundColor: '#ffffff', opacity: flash}} /> : null}
		</AbsoluteFill>
	);
};
