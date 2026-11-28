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
export type InfoKind = 'counter' | 'gauge' | 'compare' | 'scale' | 'pin';
// Infographic data (timeline.py resolves {en, ta} to this language). counter: from, to, decimals, prefix, unit ·
// gauge: value, max, unit, label · compare: items [{label, value}], unit · scale: (text) · pin: pin, track [[k, x, y, vis]], at [x, y]
export type InfoData = {
	from?: number; to?: number; decimals?: number; prefix?: string; unit?: string; label?: string;
	value?: number; max?: number; items?: {label: string; value: number}[]; pin?: string;
	track?: null | number[][]; at?: number[];
};
export type Overlay = {
	from: number; dur: number; text: string; kind: 'number' | 'icon' | 'label' | 'hook' | InfoKind; color: string;
	seg?: null | 'digits' | 'labels' | 'scan'; data?: InfoData;
};
export type Sfx = {from: number; src: string; volume: number};
// music scored in segments (a drop before the twist, a switch of mood); duckCurve is in absolute frames
export type MusicSeg = {src: string; from: number; dur: number; trimBefore: number; fadeIn: number; fadeOut: number; volume: number; duck?: number; duckCurve?: number[][]};
export type Bed = {src: string; from: number; dur: number; fade: number; volume: number; duck?: number; duckCurve?: number[][]};
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
	music: MusicSeg[];
	beds?: Bed[];
	accent?: string;
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
	grade: {tint: string; tint_opacity: number; vignette: number; contrast: number; saturate: number; brightness: number; grain?: number};
	gradeName?: string;
};
