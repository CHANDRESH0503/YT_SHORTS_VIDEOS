import React from 'react';
import {Composition, Still} from 'remotion';
import {ShortVideo} from './ShortVideo';
import type {Timeline} from './types';
import {Thumbnail, thumbDefaults} from './Thumbnail';
import {ChannelBanner, ChannelIcon} from './brand/Brand';

const baseStyle: Pick<Timeline, 'captionStyle' | 'overlayStyle' | 'grade'> = {
	captionStyle: {
		font: 'Inter',
		weight: '900',
		size: 96,
		yPercent: 70,
		maxWidthPercent: 84,
		color: '#FFFFFF',
		highlight: '#FFFFFF',
		stroke: 7,
		shadow: '0 6px 18px rgba(0,0,0,0.75)',
	},
	overlayStyle: {yPercent: 22, size: 260},
	grade: {tint: '#00B4C8', tint_opacity: 0.1, vignette: 0.45, contrast: 1.08, saturate: 1.12, brightness: 1.02},
};

const emptyTimeline: Timeline = {
	lang: 'en',
	fps: 30,
	width: 1080,
	height: 1920,
	durationInFrames: 60,
	vo: null,
	segments: [],
	captions: [{from: 0, to: 60, text: 'Load a timeline', words: [{text: 'Load', from: 0, to: 20}, {text: 'a', from: 20, to: 30}, {text: 'timeline', from: 30, to: 60}]}],
	overlays: [],
	sfx: [],
	music: null,
	...baseStyle,
};

// Static Tamil shaping test used by doctor.py --tamil
const tamilTest: Timeline = {
	...emptyTimeline,
	lang: 'ta',
	durationInFrames: 1,
	captionStyle: {...baseStyle.captionStyle, size: 88, weight: '800'},
	captions: [
		{
			from: 0,
			to: 1,
			text: 'காகம் எண்ணுமா? கண்டுபிடிப்பு',
			words: [
				{text: 'காகம்', from: 0, to: 1},
				{text: 'எண்ணுமா?', from: 0, to: 1},
				{text: 'கண்டுபிடிப்பு', from: 0, to: 1},
			],
		},
	],
};

export const RemotionRoot: React.FC = () => (
	<>
		<Composition
			id="ShortVideo"
			component={ShortVideo}
			durationInFrames={emptyTimeline.durationInFrames}
			fps={30}
			width={1080}
			height={1920}
			defaultProps={emptyTimeline}
			calculateMetadata={({props}) => ({
				durationInFrames: props.durationInFrames,
				fps: props.fps,
				width: props.width,
				height: props.height,
			})}
		/>
		<Still id="TamilTest" component={ShortVideo} width={1080} height={1920} defaultProps={tamilTest} />
		<Still id="Thumbnail" component={Thumbnail} width={1080} height={1920} defaultProps={thumbDefaults} />
		<Still id="ChannelIcon" component={ChannelIcon} width={800} height={800} defaultProps={{lang: 'en' as const}} />
		<Still id="ChannelBanner" component={ChannelBanner} width={2560} height={1440} defaultProps={{lang: 'en' as const, showSafe: false}} />
	</>
);
