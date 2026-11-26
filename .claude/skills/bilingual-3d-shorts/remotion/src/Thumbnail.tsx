import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadTamil} from '@remotion/google-fonts/NotoSansTamil';
import {fitText} from '@remotion/layout-utils';
import {Grade} from './components/Grade';
import type {Timeline} from './types';

const inter = loadInter('normal', {weights: ['800', '900'], subsets: ['latin']});
const tamil = loadTamil('normal', {weights: ['700', '800'], subsets: ['tamil']});

// Shorts thumbnail: graded frame + big 2-4 word hook (|line breaks|, *accent word*) + channel badge.
// Safe area: text between 12% and 45% of height; badge above the bottom 20%.
export type ThumbProps = {
	lang: 'en' | 'ta';
	image: string; // path inside --public-dir (project dir)
	text: string; // e.g. "Your clock is|*LYING*"
	channel: string;
	accent: string;
	grade: Timeline['grade'];
};

export const thumbDefaults: ThumbProps = {
	lang: 'en',
	image: '',
	text: 'Thumbnail|*TEXT*',
	channel: 'How is this',
	accent: '#7DF9FF',
	grade: {tint: '#00B4C8', tint_opacity: 0.1, vignette: 0.45, contrast: 1.08, saturate: 1.12, brightness: 1.02},
};

const W = 1080;
const MAX_W = W * 0.86;

export const Thumbnail: React.FC<ThumbProps> = ({lang, image, text, channel, accent, grade}) => {
	const font = lang === 'ta' ? `${tamil.fontFamily}, ${inter.fontFamily}` : inter.fontFamily;
	const weight = lang === 'ta' ? '800' : '900';
	const lines = text.split('|').map((l) => l.trim()).filter(Boolean);
	const maxSize = lang === 'ta' ? 150 : 190;
	const sizes = lines.map((l) => {
		const plain = l.replace(/\*/g, '');
		const fit = fitText({text: plain, withinWidth: MAX_W, fontFamily: font, fontWeight: weight});
		return Math.min(maxSize, Math.floor(fit.fontSize));
	});

	return (
		<AbsoluteFill style={{backgroundColor: '#04161c'}}>
			<AbsoluteFill style={{filter: `contrast(${grade.contrast + 0.05}) saturate(${grade.saturate + 0.1}) brightness(${grade.brightness})`}}>
				{image ? <Img src={staticFile(image)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.08)'}} /> : null}
			</AbsoluteFill>
			<Grade grade={grade} />
			{/* readability gradient behind the headline */}
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(1,10,13,0.88) 0%, rgba(1,10,13,0.55) 38%, rgba(1,10,13,0) 58%)'}} />

			<div
				style={{
					position: 'absolute',
					top: 1920 * 0.12,
					left: 0,
					right: 0,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					gap: 6,
				}}
			>
				{lines.map((l, i) => (
					<div
						key={i}
						style={{
							fontFamily: font,
							fontWeight: weight,
							fontSize: sizes[i],
							lineHeight: lang === 'ta' ? 1.32 : 1.04,
							letterSpacing: lang === 'ta' ? 0 : -2,
							textAlign: 'center',
							color: '#FFFFFF',
							WebkitTextStroke: `${lang === 'ta' ? 8 : 10}px #000`,
							paintOrder: 'stroke fill',
							textShadow: '0 10px 30px rgba(0,0,0,0.85)',
							whiteSpace: 'nowrap',
						}}
					>
						{l.split(/(\*[^*]+\*)/).map((part, j) =>
							part.startsWith('*') ? (
								<span key={j} style={{color: accent, filter: `drop-shadow(0 0 22px ${accent})`}}>
									{part.slice(1, -1)}
								</span>
							) : (
								<span key={j}>{part}</span>
							),
						)}
					</div>
				))}
			</div>

			{/* channel badge */}
			<div style={{position: 'absolute', bottom: 1920 * 0.215, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 18,
						padding: '16px 34px 16px 22px',
						borderRadius: 999,
						background: 'rgba(3, 22, 28, 0.78)',
						border: '3px solid rgba(125,249,255,0.75)',
						boxShadow: '0 0 26px rgba(0,180,200,0.55)',
					}}
				>
					<div
						style={{
							width: 50,
							height: 50,
							borderRadius: 999,
							background: 'radial-gradient(circle at 35% 30%, #b8fcff, #19c3d6 60%, #0a7d8c)',
							boxShadow: '0 0 16px rgba(125,249,255,0.8)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontFamily: inter.fontFamily,
							fontWeight: '900',
							fontSize: 36,
							color: '#03161c',
						}}
					>
						?
					</div>
					<div style={{fontFamily: `${inter.fontFamily}, ${tamil.fontFamily}`, fontWeight: '800', fontSize: 44, color: '#fff', letterSpacing: 0.5}}>{channel}</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};
