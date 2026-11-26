import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useVideoConfig} from 'remotion';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadTamil} from '@remotion/google-fonts/NotoSansTamil';
import {Shot} from './components/Shot';
import {Captions} from './components/Captions';
import {OverlayCallout} from './components/Overlay';
import {Grade} from './components/Grade';
import {EndCardView} from './components/EndCard';
import type {Timeline} from './types';

const inter = loadInter('normal', {weights: ['800', '900'], subsets: ['latin']});
const tamil = loadTamil('normal', {weights: ['700', '800'], subsets: ['tamil']});

export const ShortVideo: React.FC<Timeline> = (tl) => {
	const {width, durationInFrames} = useVideoConfig();
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
					<OverlayCallout ov={ov} style={tl.overlayStyle} fontFamily={font} />
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
			{tl.music ? (
				<Audio
					src={staticFile(tl.music.src)}
					loop
					volume={(f) =>
						tl.music!.volume *
						interpolate(f, [0, 10, durationInFrames - 30, durationInFrames], [0, 1, 1, 0], {
							extrapolateLeft: 'clamp',
							extrapolateRight: 'clamp',
						})
					}
				/>
			) : null}
			{tl.sfx.map((s, i) => (
				<Sequence key={`sfx${i}`} from={s.from} layout="none">
					<Audio src={staticFile(s.src)} volume={s.volume} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
