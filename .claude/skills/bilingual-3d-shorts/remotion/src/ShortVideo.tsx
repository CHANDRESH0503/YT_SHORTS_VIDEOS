import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useVideoConfig} from 'remotion';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadTamil} from '@remotion/google-fonts/NotoSansTamil';
import {Shot} from './components/Shot';
import {Captions} from './components/Captions';
import {OverlayCallout} from './components/Overlay';
import {Grade} from './components/Grade';
import {EndCardView} from './components/EndCard';
import type {MusicSeg, Timeline} from './types';

const inter = loadInter('normal', {weights: ['800', '900'], subsets: ['latin']});
const tamil = loadTamil('normal', {weights: ['700', '800'], subsets: ['tamil']});

// fade in/out (frames) inside a segment of length dur
const fades = (f: number, dur: number, fin: number, fout: number) =>
	Math.min(fin > 0 ? interpolate(f, [0, fin], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1,
		fout > 0 ? interpolate(f, [dur - fout, dur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1);
// ducking: gain 1 between lines, `duck` under speech (curve built by timeline.py, absolute frames)
const ducked = (m: {duck?: number; duckCurve?: number[][]}, abs: number) => {
	const c = m.duckCurve;
	const g = c && c.length > 1 ? interpolate(abs, c.map((p) => p[0]), c.map((p) => p[1]), {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
	const duck = m.duck ?? 1;
	return duck + (1 - duck) * g;
};

export const ShortVideo: React.FC<Timeline> = (tl) => {
	const {width, durationInFrames} = useVideoConfig();
	// older timelines had one music object: treat it as a single segment over the whole video
	const legacy = tl.music as unknown as null | (Omit<MusicSeg, 'from' | 'dur' | 'trimBefore' | 'fadeIn' | 'fadeOut'>);
	const music: MusicSeg[] = Array.isArray(tl.music) ? tl.music : legacy ? [{...legacy, from: 0, dur: durationInFrames, trimBefore: 0, fadeIn: 10, fadeOut: 30}] : [];
	const font = tl.lang === 'ta' ? `${tamil.fontFamily}, ${inter.fontFamily}` : inter.fontFamily;
	const g = tl.grade;

	return (
		<AbsoluteFill style={{backgroundColor: '#04161c'}}>
			{tl.segments.length === 0 ? (
				<AbsoluteFill style={{background: 'radial-gradient(circle at 50% 35%, #1fb6c9 0%, #0a4f5c 55%, #031a20 100%)'}} />
			) : null}
			<AbsoluteFill style={{filter: `contrast(${g.contrast}) saturate(${g.saturate}) brightness(${g.brightness})`}}>
				{tl.segments.map((seg, i) => (
					<Sequence key={`${seg.shot}-${i}`} from={seg.from} durationInFrames={seg.dur}>
						<Shot seg={seg} next={tl.segments[i + 1]?.transition} width={width} />
					</Sequence>
				))}
			</AbsoluteFill>
			<Grade grade={g} />

			{tl.overlays.map((ov, i) => (
				<Sequence key={`ov${i}`} from={ov.from} durationInFrames={Math.max(1, ov.dur)}>
					<OverlayCallout ov={ov} style={tl.overlayStyle} fontFamily={font} accent={tl.accent} />
				</Sequence>
			))}

			<Captions captions={tl.captions} style={tl.captionStyle} fontFamily={font} />

			{tl.endCard ? (
				<Sequence from={tl.endCard.from} durationInFrames={tl.endCard.dur}>
					<EndCardView card={tl.endCard} lang={tl.lang} fontFamily={font} />
				</Sequence>
			) : null}

			{tl.vo ? (
				<Sequence from={tl.vo.from}>
					<Audio src={staticFile(tl.vo.src)} />
				</Sequence>
			) : null}
			{music.map((m, i) => (
				<Sequence key={`mu${i}`} from={m.from} durationInFrames={m.dur} layout="none">
					<Audio src={staticFile(m.src)} loop trimBefore={m.trimBefore || undefined} volume={(f) => m.volume * fades(f, m.dur, m.fadeIn, m.fadeOut) * ducked(m, m.from + f)} />
				</Sequence>
			))}
			{(tl.beds ?? []).map((b, i) => (
				<Sequence key={`bed${i}`} from={b.from} durationInFrames={b.dur} layout="none">
					<Audio src={staticFile(b.src)} loop volume={(f) => b.volume * fades(f, b.dur, b.fade, b.fade) * ducked(b, b.from + f)} />
				</Sequence>
			))}
			{tl.sfx.map((s, i) => (
				<Sequence key={`sfx${i}`} from={s.from} layout="none">
					<Audio src={staticFile(s.src)} volume={s.volume} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
