export type Transition = 'cut' | 'whip_left' | 'whip_right' | 'zoom' | 'flash' | 'punch';
export type Move =
	| 'push_in'
	| 'pull_out'
	| 'pan_left'
	| 'pan_right'
	| 'tilt_up'
	| 'tilt_down'
	| 'orbit_left'
	| 'orbit_right'
	| 'static_drift';

export type Segment = {
	shot: string;
	beat: string;
	from: number;
	dur: number;
	move: Move;
	transition: Transition;
	image: string;
	clip: null | {src: string; startFrom: number; playbackRate: number; frames: number};
};

export type CaptionWord = {text: string; from: number; to: number};
export type Caption = {from: number; to: number; text: string; words: CaptionWord[]};
export type Overlay = {from: number; dur: number; text: string; kind: 'number' | 'icon' | 'label'; color: string; seg?: null | 'digits' | 'labels' | 'scan'};
export type Sfx = {from: number; src: string; volume: number};
export type EndCard = {from: number; dur: number; logo: string; channel: string; cta: string; subline: string};

export type Timeline = {
	lang: 'en' | 'ta';
	fps: number;
	width: number;
	height: number;
	durationInFrames: number;
	vo: null | {src: string; from: number};
	segments: Segment[];
	captions: Caption[];
	overlays: Overlay[];
	sfx: Sfx[];
	music: null | {src: string; volume: number};
	endCard?: null | EndCard;
	captionStyle: {
		font: string;
		weight: string;
		size: number;
		yPercent: number;
		maxWidthPercent: number;
		color: string;
		highlight: string;
		stroke: number;
		shadow: string;
	};
	overlayStyle: {yPercent: number; size: number};
	grade: {tint: string; tint_opacity: number; vignette: number; contrast: number; saturate: number; brightness: number};
};
