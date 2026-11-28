// 16:9 long-form composition: code-built motion-graphics shots, chapter/title cards, captions, chapter chip, end card.
// Props come from projects/<slug>/timeline_long_<lang>.json (tools/long_timeline.py). Audio is muxed afterwards.
import React from 'react';
import {AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {C, Bg, Center, Lang, clamp, ease, eout, font, glow, rnd, sp} from './kit';
import * as CH from './scenes/charts';
import * as MO from './scenes/money';
import * as ST from './scenes/story';

export type LShot = {id: string; viz: string; p: any; cam: string; from: number; dur: number; t0: number; full: number; chapter: string};
export type LCard = {kind: 'title' | 'chapter'; from: number; dur: number; text: string; sub?: string; num?: number};
export type LCap = {from: number; to: number; text: string; words: {text: string; from: number; to: number}[]};
export type LongTimeline = {
	lang: Lang; fps: number; width: number; height: number; durationInFrames: number;
	shots: LShot[]; cards: LCard[]; captions: LCap[]; chapters: {num: number; text: string; from: number}[];
	endCard: {from: number; dur: number; logo: string; channel: string; cta: string};
};

const REG: Record<string, React.FC<any>> = {
	chart: CH.Chart, intraday: CH.Intraday, thumb: CH.Thumb, cascade: CH.Cascade, plunge: CH.Plunge, wick: CH.Wick, alts: CH.Alts, sellbounce: CH.SellBounce,
	num: MO.Num, bars: MO.Bars, mcap: MO.Mcap, tank: MO.Tank, lever: MO.Lever, house: MO.House, liq: MO.Liq, sell: MO.Sell,
	collateral: MO.Collateral, flow: MO.Flow, companies: MO.Companies, longshort: MO.LongShort, venue: MO.Venue, odds: MO.Odds,
	shop: MO.Shop, fund: MO.Fund, adl: MO.Adl, cash: MO.Cash, scoreboard: MO.Scoreboard,
	calendar: ST.Calendar, card: ST.Card, question: ST.Question, word: ST.Word, confetti: ST.Confetti, crowd: ST.Crowd, clock: ST.Clock,
	arrows: ST.Arrows, reserve: ST.Reserve, law: ST.Law, peg: ST.Peg, cracks: ST.Cracks, hack: ST.Hack, catch: ST.Catch, iceberg: ST.Iceberg,
	loop: ST.Loop, domino: ST.Domino, post: ST.Post, globe: ST.Globe, closed: ST.Closed, open247: ST.Open247, ticker: ST.Ticker, robot: ST.Robot,
	book: ST.Book, shock: ST.Shock, floor: ST.Floor, coinspot: ST.CoinSpot, oracle: ST.Oracle, emptyroom: ST.EmptyRoom, pending: ST.Pending,
	sellers: ST.Sellers, fedbuilding: ST.FedBuilding, tap: ST.Tap, riskladder: ST.RiskLadder, whales: ST.Whales, match: ST.Match,
};

const XF = 6;

const camera = (cam: string, u: number, f: number) => {
	const e = ease(u);
	const hand = `translate(${Math.sin(f / 23) * 3}px, ${Math.cos(f / 29) * 2.5}px)`;
	switch (cam) {
		case 'push_in': return `${hand} scale(${1 + 0.09 * e})`;
		case 'pull_out': return `${hand} scale(${1.1 - 0.09 * e})`;
		case 'pan_left': return `${hand} scale(1.07) translateX(${40 - 80 * e}px)`;
		case 'pan_right': return `${hand} scale(1.07) translateX(${-40 + 80 * e}px)`;
		case 'tilt_up': return `${hand} scale(1.07) translateY(${30 - 60 * e}px)`;
		case 'tilt_down': return `${hand} scale(1.07) translateY(${-30 + 60 * e}px)`;
		case 'orbit_left': return `${hand} scale(${1.06 + 0.03 * e}) rotate(${1.2 - 2.4 * e}deg) translateX(${20 - 40 * e}px)`;
		case 'orbit_right': return `${hand} scale(${1.06 + 0.03 * e}) rotate(${-1.2 + 2.4 * e}deg) translateX(${-20 + 40 * e}px)`;
		default: return `${hand} scale(${1.02 + 0.02 * e})`;
	}
};

const ShotView: React.FC<{s: LShot; lang: Lang; first: boolean}> = ({s, lang, first}) => {
	const f = useCurrentFrame();
	const Comp = REG[s.viz] ?? ST.Question;
	const u = clamp(f / Math.max(1, s.dur));
	const fin = first ? 1 : clamp(f / XF);
	const pop = first ? 1 : interpolate(fin, [0, 1], [1.035, 1]);
	return (
		<AbsoluteFill style={{opacity: fin, transform: `scale(${pop})`}}>
			<AbsoluteFill style={{transform: camera(s.cam, u, f + s.from)}}>
				<Comp p={s.p ?? {}} lang={lang} f={f + s.t0} full={s.full} />
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

const TitleCard: React.FC<{c: LCard; lang: Lang}> = ({c, lang}) => {
	const f = useCurrentFrame();
	const s = sp(f, 2, 12, 120);
	const out = clamp((c.dur - f) / 8);
	return (
		<AbsoluteFill style={{background: '#000', opacity: out}}>
			<Bg f={f} tint="#1d0a10" />
			<svg width={1920} height={1080} style={{position: 'absolute', opacity: 0.35}}>
				<path d="M100,700 L500,560 L800,600 L1100,380 L1250,340 L1300,820 L1500,700 L1820,760" stroke={C.red} strokeWidth={8} fill="none"
					strokeDasharray={3000} strokeDashoffset={3000 * (1 - eout(f / 50))} />
			</svg>
			<Center style={{flexDirection: 'column', gap: 30}}>
				<div style={{fontFamily: font(lang), fontWeight: 700, fontSize: lang === 'ta' ? 86 : 100, color: C.white, textAlign: 'center', maxWidth: 1600,
					lineHeight: 1.1, transform: `scale(${0.9 + 0.1 * s})`, opacity: clamp(s * 1.4), textShadow: glow('#ff3b5c', 20)}}>{c.text}</div>
				<div style={{fontFamily: font(lang, 'mono'), fontSize: lang === 'ta' ? 38 : 42, color: C.orange, letterSpacing: '0.12em', opacity: clamp((f - 14) / 10)}}>
					{c.sub?.toUpperCase()}
				</div>
			</Center>
		</AbsoluteFill>
	);
};

const ChapterCard: React.FC<{c: LCard; lang: Lang}> = ({c, lang}) => {
	const f = useCurrentFrame();
	const n = Math.floor(clamp((f - 8) / 26) * c.text.length);
	const out = clamp((c.dur - f) / 6);
	const inn = clamp(f / 5);
	return (
		<AbsoluteFill style={{background: '#000', opacity: Math.min(out, inn)}}>
			<Center style={{flexDirection: 'column', gap: 26}}>
				<div style={{fontFamily: font(lang, 'mono'), fontSize: 34, color: C.orange, letterSpacing: '0.4em', opacity: clamp(f / 8)}}>
					{lang === 'ta' ? `அத்தியாயம் ${c.num}` : `CHAPTER ${String(c.num).padStart(2, '0')}`}
				</div>
				<div style={{width: 600 * eout(clamp(f / 18)), height: 3, background: C.orange}} />
				<div style={{fontFamily: font(lang), fontWeight: 700, fontSize: lang === 'ta' ? 100 : 120, color: '#F4F1E8', minHeight: 150}}>
					{lang === 'ta' ? c.text.slice(0, Math.max(0, Math.floor(clamp((f - 8) / 18) * c.text.length))) : c.text.slice(0, n)}
					<span style={{color: C.orange, opacity: Math.floor(f / 7) % 2 ? 0 : 1}}>▌</span>
				</div>
			</Center>
		</AbsoluteFill>
	);
};

const Captions: React.FC<{caps: LCap[]; lang: Lang}> = ({caps, lang}) => {
	const f = useCurrentFrame();
	const a = caps.find((c) => f >= c.from && f < c.to);
	if (!a) return null;
	const local = f - a.from;
	const pop = sp(local, 0, 14, 260, 0.5);
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div style={{position: 'absolute', bottom: 70, left: 0, right: 0, display: 'flex', justifyContent: 'center',
				transform: `translateY(${(1 - pop) * 14}px)`, opacity: clamp(pop * 2)}}>
				<div style={{maxWidth: 1500, textAlign: 'center', fontFamily: font(lang, 'body'), fontWeight: 800, fontSize: lang === 'ta' ? 50 : 58, lineHeight: 1.25,
					color: '#fff', WebkitTextStroke: '8px rgba(0,0,0,0.9)', paintOrder: 'stroke fill', textShadow: '0 6px 18px rgba(0,0,0,0.8)',
					background: 'rgba(3,6,14,0.55)', padding: '8px 28px', borderRadius: 16, boxShadow: '0 0 40px rgba(3,6,14,0.6)'}}>
					{a.words.map((w, i) => {
						const on = f >= w.from && f < Math.max(w.to, w.from + 4);
						return <span key={i} style={{color: on ? '#FFD34D' : '#fff', marginRight: i < a.words.length - 1 ? '0.25em' : 0, display: 'inline-block',
							transform: on ? 'scale(1.06)' : 'none'}}>{w.text}</span>;
					})}
				</div>
			</div>
		</AbsoluteFill>
	);
};

const ChapterChip: React.FC<{tl: LongTimeline}> = ({tl}) => {
	const f = useCurrentFrame();
	const cur = [...tl.chapters].reverse().find((c) => f >= c.from);
	if (!cur || f >= tl.endCard.from) return null;
	const card = tl.cards.find((c) => c.kind === 'chapter' && c.num === cur.num);
	const since = f - (card ? card.from + card.dur : cur.from);
	if (since < 0) return null;
	const o = clamp(since / 12) * (since < 150 ? 1 : 0.55);
	return (
		<div style={{position: 'absolute', top: 44, left: 56, display: 'flex', alignItems: 'center', gap: 16, opacity: o, fontFamily: font(tl.lang, 'mono'),
			fontSize: tl.lang === 'ta' ? 24 : 26, color: C.white, background: 'rgba(0,0,0,0.45)', padding: '10px 22px', borderRadius: 40, border: `1px solid ${C.line}`}}>
			<span style={{color: C.orange, fontWeight: 800}}>{String(cur.num).padStart(2, '0')}</span>
			<span style={{letterSpacing: tl.lang === 'ta' ? 0 : '0.12em'}}>{tl.lang === 'ta' ? cur.text : cur.text.toUpperCase()}</span>
		</div>
	);
};

const EndCard: React.FC<{tl: LongTimeline}> = ({tl}) => {
	const f = useCurrentFrame();
	const e = tl.endCard;
	const logo = sp(f, 2, 11, 160, 0.8);
	const btn = sp(f, 14, 9, 190, 0.7);
	const ring = (f % 30) / 30;
	const pulse = 1 + Math.max(0, Math.sin((f - 20) / 5)) * 0.06 * (f > 20 ? 1 : 0);
	return (
		<AbsoluteFill style={{opacity: clamp(f / 8)}}>
			<AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, #0f5560 0%, #06262d 48%, #020c0f 100%)'}} />
			<AbsoluteFill style={{backgroundImage: 'linear-gradient(rgba(125,249,255,0.07) 2px, transparent 2px), linear-gradient(90deg, rgba(125,249,255,0.07) 2px, transparent 2px)',
				backgroundSize: '80px 80px', backgroundPosition: `0px ${f * 2}px`}} />
			<Center style={{gap: 90}}>
				<div style={{position: 'relative', width: 380, height: 380, transform: `scale(${(0.4 + 0.6 * logo) * (1 + Math.sin(f / 7) * 0.02)})`}}>
					<div style={{position: 'absolute', inset: -18, borderRadius: '50%', border: '6px solid rgba(125,249,255,0.55)', transform: `scale(${1 + ring * 0.18})`, opacity: 1 - ring}} />
					<Img src={staticFile(e.logo)} style={{width: 380, height: 380, borderRadius: '50%', boxShadow: '0 0 60px rgba(34,211,230,0.45)'}} />
				</div>
				<div style={{display: 'flex', flexDirection: 'column', gap: 40}}>
					<div style={{fontFamily: font(tl.lang), fontWeight: 700, fontSize: 92, color: '#EAFBFD', textShadow: '0 0 30px rgba(125,249,255,0.45)'}}>{e.channel}</div>
					<div style={{alignSelf: 'flex-start', transform: `scale(${btn * pulse})`, background: '#E62117', color: '#fff', fontFamily: font(tl.lang, 'body'), fontWeight: 900,
						fontSize: tl.lang === 'ta' ? 54 : 64, padding: '22px 60px', borderRadius: 18, boxShadow: '0 12px 40px rgba(230,33,23,0.5)'}}>{e.cta}</div>
				</div>
			</Center>
		</AbsoluteFill>
	);
};

export const LongVideo: React.FC<LongTimeline> = (tl) => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill style={{background: C.bg0}}>
			{tl.shots.map((s, i) => (
				<Sequence key={s.id} from={s.from} durationInFrames={s.dur + XF} layout="none">
					<ShotView s={s} lang={tl.lang} first={i === 0} />
				</Sequence>
			))}
			<ChapterChip tl={tl} />
			{tl.cards.map((c, i) => (
				<Sequence key={`c${i}`} from={c.from} durationInFrames={c.dur} layout="none">
					{c.kind === 'title' ? <TitleCard c={c} lang={tl.lang} /> : <ChapterCard c={c} lang={tl.lang} />}
				</Sequence>
			))}
			<Captions caps={tl.captions} lang={tl.lang} />
			<Sequence from={tl.endCard.from} durationInFrames={tl.endCard.dur} layout="none">
				<EndCard tl={tl} />
			</Sequence>
			{/* film finish: vignette + grain */}
			<AbsoluteFill style={{pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)'}} />
			<AbsoluteFill style={{pointerEvents: 'none', backgroundImage: `url(${staticFile('noise.png')})`, opacity: 0.035, mixBlendMode: 'overlay',
				backgroundPosition: `${Math.floor(rnd(f) * 512)}px ${Math.floor(rnd(f + 7) * 512)}px`}} />
		</AbsoluteFill>
	);
};

export const longDefaults: LongTimeline = {
	lang: 'en', fps: 30, width: 1920, height: 1080, durationInFrames: 90,
	shots: [{id: 'S1', viz: 'chart', p: {a: '01-01', b: '12-31', draw: true}, cam: 'push_in', from: 0, dur: 90, t0: 0, full: 90, chapter: 'C1'}],
	cards: [], captions: [], chapters: [],
	endCard: {from: 90, dur: 1, logo: 'brand/icon_en.png', channel: 'How is this', cta: 'SUBSCRIBE'},
};
