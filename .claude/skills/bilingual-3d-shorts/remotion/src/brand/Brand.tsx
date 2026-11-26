import React from 'react';
import {AbsoluteFill} from 'remotion';
import {loadFont as loadGrotesk} from '@remotion/google-fonts/SpaceGrotesk';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadCatamaran} from '@remotion/google-fonts/Catamaran';

const grotesk = loadGrotesk('normal', {weights: ['700'], subsets: ['latin']});
const inter = loadInter('normal', {weights: ['500', '600', '800'], subsets: ['latin']});
const catamaran = loadCatamaran('normal', {weights: ['700', '800', '900'], subsets: ['tamil', 'latin']});

// ---------------- palette ----------------
const C = {
	bgDeep: '#020c0f',
	bgMid: '#06262d',
	bgLift: '#0c4650',
	cyan: '#7DF9FF',
	cyanMid: '#22D3E6',
	cyanDeep: '#0A8FA0',
	spark: '#FF4A2E',
	sparkHot: '#FFB199',
	saffron: '#FFB547',
	ink: '#EAFBFD',
};

export type BrandProps = {lang: 'en' | 'ta'};

// ---------------- the mark: a segmented question mark ----------------
// Built on the same hex-ended segment geometry as a 7-segment digit (unit box 120 x 220), italic skew.
const T = 30;
const h = T / 2;
const hbar = (xa: number, xb: number, y: number) =>
	`M${xa},${y} L${xa + h},${y - h} L${xb - h},${y - h} L${xb},${y} L${xb - h},${y + h} L${xa + h},${y + h} Z`;
const vbar = (x: number, ya: number, yb: number) =>
	`M${x},${ya} L${x + h},${ya + h} L${x + h},${yb - h} L${x},${yb} L${x - h},${yb - h} L${x - h},${ya + h} Z`;
const G = 7; // gap between segments
const X0 = h;
const X1 = 120 - h;
const Y0 = h;
const YM = 112;
const QM_SEGS = [
	hbar(X0 + G, X1 - G, Y0), // top
	vbar(X1, Y0 + G, YM - G), // upper right
	vbar(X0, Y0 + G, 62), // short upper-left hook
	hbar(60 - h + G, X1 - G, YM), // middle (right half)
	vbar(60 - h, YM + G, 172), // stem
];

export const Mark: React.FC<{size: number; glow?: number; idSuffix?: string}> = ({size, glow = 1, idSuffix = ''}) => {
	const gid = `qmGrad${idSuffix}`;
	const fid = `qmGlow${idSuffix}`;
	const sid = `spark${idSuffix}`;
	return (
		<svg width={size} height={size * 1.35} viewBox="-40 -40 200 310" style={{overflow: 'visible'}}>
			<defs>
				<linearGradient id={gid} x1="0" y1="0" x2="0.35" y2="1">
					<stop offset="0" stopColor="#E9FEFF" />
					<stop offset="0.35" stopColor={C.cyan} />
					<stop offset="1" stopColor={C.cyanMid} />
				</linearGradient>
				<radialGradient id={sid} cx="0.4" cy="0.35" r="0.7">
					<stop offset="0" stopColor="#FFE6DD" />
					<stop offset="0.35" stopColor={C.sparkHot} />
					<stop offset="1" stopColor={C.spark} />
				</radialGradient>
				<filter id={fid} x="-60%" y="-60%" width="220%" height="220%">
					<feGaussianBlur stdDeviation={9 * glow} result="b" />
					<feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.85 0" result="b2" />
					<feMerge>
						<feMergeNode in="b2" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>
			<g transform="skewX(-8) translate(18,0)">
				<g filter={`url(#${fid})`}>
					{QM_SEGS.map((d, i) => (
						<path key={i} d={d} fill={`url(#${gid})`} />
					))}
				</g>
				{/* the spark: the "aha" dot */}
				<g filter={`url(#${fid})`}>
					<rect x={60 - h - 17} y={196} width={34} height={34} rx={9} fill={`url(#${sid})`} transform={`rotate(45 ${60 - h} 213)`} />
				</g>
			</g>
		</svg>
	);
};

// subtle blueprint grid as a CSS background
const grid = (step: number, alpha: number) => ({
	backgroundImage: `linear-gradient(rgba(125,249,255,${alpha}) 1px, transparent 1px), linear-gradient(90deg, rgba(125,249,255,${alpha}) 1px, transparent 1px)`,
	backgroundSize: `${step}px ${step}px`,
});

// ---------------- channel icon 800x800 (YouTube shows it as a circle) ----------------
export const ChannelIcon: React.FC<BrandProps> = ({lang}) => (
	<AbsoluteFill style={{background: `radial-gradient(circle at 50% 38%, ${C.bgLift} 0%, ${C.bgMid} 42%, ${C.bgDeep} 78%)`}}>
		<AbsoluteFill style={{...grid(40, 0.05), maskImage: 'radial-gradient(circle at 50% 50%, black 30%, transparent 68%)', WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 30%, transparent 68%)'}} />
		{/* ring inside the circle crop */}
		<AbsoluteFill style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
			<div style={{width: 700, height: 700, borderRadius: '50%', border: '3px solid rgba(125,249,255,0.18)', boxShadow: 'inset 0 0 60px rgba(34,211,230,0.12)'}} />
		</AbsoluteFill>
		<AbsoluteFill style={{display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: lang === 'ta' ? 96 : 0, paddingLeft: 18}}>
			<Mark size={lang === 'ta' ? 420 : 470} idSuffix={`icon${lang}`} />
		</AbsoluteFill>
		{lang === 'ta' ? (
			<div style={{position: 'absolute', bottom: 118, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
				<div
					style={{
						fontFamily: catamaran.fontFamily,
						fontWeight: 900,
						fontSize: 70,
						lineHeight: 1,
						padding: '14px 38px 6px',
						borderRadius: 999,
						color: '#1a0e02',
						background: `linear-gradient(180deg, #FFD27A, ${C.saffron})`,
						boxShadow: '0 8px 24px rgba(0,0,0,0.45), 0 0 26px rgba(255,181,71,0.35)',
					}}
				>
					தமிழ்
				</div>
			</div>
		) : null}
	</AbsoluteFill>
);

// ---------------- banner 2560x1440, safe area 1546x423 centred ----------------
const SAFE_W = 1546;
const SAFE_H = 423;

// line-art "explainer" motifs, kept outside the safe area (visible on desktop width / TV)
const Motifs: React.FC = () => {
	const stroke = 'rgba(125,249,255,0.22)';
	const faint = 'rgba(125,249,255,0.10)';
	const gearPath = (cx: number, cy: number, r: number, teeth: number) => {
		const pts: string[] = [];
		for (let i = 0; i < teeth * 2; i++) {
			const a0 = (i / (teeth * 2)) * Math.PI * 2;
			const a1 = ((i + 1) / (teeth * 2)) * Math.PI * 2;
			const rr = i % 2 ? r : r * 1.16;
			pts.push(`${cx + Math.cos(a0) * rr},${cy + Math.sin(a0) * rr}`, `${cx + Math.cos(a1) * rr},${cy + Math.sin(a1) * rr}`);
		}
		return `M${pts.join(' L')} Z`;
	};
	const wave = (x0: number, y: number, len: number, amp: number, k: number, ph = 0) => {
		const p: string[] = [];
		for (let x = 0; x <= len; x += 6) p.push(`${x0 + x},${y + Math.sin(x * k + ph) * amp * Math.sin((x / len) * Math.PI)}`);
		return `M${p.join(' L')}`;
	};
	return (
		<svg width={2560} height={1440} style={{position: 'absolute', inset: 0}}>
			{/* left: orbit / atom */}
			<g transform="translate(300,760)" fill="none" stroke={stroke} strokeWidth={3}>
				<ellipse rx={200} ry={70} />
				<ellipse rx={200} ry={70} transform="rotate(60)" />
				<ellipse rx={200} ry={70} transform="rotate(-60)" />
				<circle r={18} fill={C.cyanMid} stroke="none" opacity={0.6} />
				<circle cx={200} cy={0} r={8} fill={C.cyan} stroke="none" opacity={0.7} />
			</g>
			{/* left: gear pair */}
			<g fill="none" stroke={faint} strokeWidth={3}>
				<path d={gearPath(250, 470, 60, 12)} />
				<circle cx={250} cy={470} r={18} />
				<path d={gearPath(340, 545, 38, 9)} transform="rotate(12 340 545)" />
			</g>
			{/* left: sine waves */}
			<g fill="none" strokeWidth={3}>
				<path d={wave(60, 980, 640, 40, 0.03)} stroke={stroke} />
				<path d={wave(60, 980, 640, 40, 0.03, Math.PI)} stroke={faint} />
			</g>
			{/* right: circuit traces with nodes */}
			<g fill="none" stroke={stroke} strokeWidth={3} strokeLinejoin="round">
				{[0, 1, 2, 3, 4].map((i) => (
					<React.Fragment key={i}>
						<path d={`M2560,${560 + i * 70} L${2260 - i * 20},${560 + i * 70} L${2180 - i * 20},${640 + i * 40} L${2120},${640 + i * 40}`} />
						<circle cx={2120} cy={640 + i * 40} r={7} fill={i === 2 ? C.spark : C.cyan} stroke="none" opacity={0.8} />
					</React.Fragment>
				))}
				<rect x={2300} y={470} width={120} height={70} rx={8} stroke={faint} />
			</g>
			{/* right: outlined 7-segment "8" */}
			<g transform="translate(2290,830) skewX(-8)" fill="none" stroke={faint} strokeWidth={3}>
				{[hbar(X0 + G, X1 - G, Y0), vbar(X1, Y0 + G, YM - G), vbar(X1, YM + G, 224 - h - G), hbar(X0 + G, X1 - G, 224 - h), vbar(X0, YM + G, 224 - h - G), vbar(X0, Y0 + G, YM - G), hbar(X0 + G, X1 - G, YM)].map((d, i) => (
					<path key={i} d={d} />
				))}
			</g>
			{/* right: bar chart */}
			<g fill={faint}>
				{[90, 150, 120, 200, 170].map((hgt, i) => (
					<rect key={i} x={2000 + i * 44} y={1080 - hgt} width={28} height={hgt} rx={4} />
				))}
			</g>
		</svg>
	);
};

export const ChannelBanner: React.FC<BrandProps & {showSafe?: boolean}> = ({lang, showSafe}) => {
	const ta = lang === 'ta';
	return (
		<AbsoluteFill
			style={{
				background: `radial-gradient(ellipse 60% 55% at 50% 50%, ${C.bgLift} 0%, ${C.bgMid} 45%, ${C.bgDeep} 100%)`,
			}}
		>
			<AbsoluteFill style={{...grid(64, 0.045)}} />
			<Motifs />
			{/* horizontal light streak behind the logo */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: 720 - 2,
					height: 4,
					background: 'linear-gradient(90deg, transparent, rgba(125,249,255,0.35) 30%, rgba(125,249,255,0.35) 70%, transparent)',
					filter: 'blur(1px)',
				}}
			/>
			{/* safe-area lockup */}
			<div
				style={{
					position: 'absolute',
					left: (2560 - SAFE_W) / 2,
					top: (1440 - SAFE_H) / 2,
					width: SAFE_W,
					height: SAFE_H,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					gap: 56,
				}}
			>
				<div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', width: 240, height: 360, marginTop: 4}}>
					<Mark size={236} idSuffix={`banner${lang}`} />
				</div>
				<div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
					<div style={{display: 'flex', alignItems: 'center', gap: 30}}>
						<div
							style={{
								fontFamily: grotesk.fontFamily,
								fontWeight: 700,
								fontSize: 168,
								lineHeight: 1,
								letterSpacing: -5,
								color: C.ink,
								textShadow: '0 6px 30px rgba(0,0,0,0.5)',
							}}
						>
							How is <span style={{color: C.cyan, textShadow: '0 0 34px rgba(125,249,255,0.45)'}}>this</span>
						</div>
						{ta ? (
							<div
								style={{
									fontFamily: catamaran.fontFamily,
									fontWeight: 900,
									fontSize: 72,
									lineHeight: 1,
									padding: '16px 34px 6px',
									borderRadius: 999,
									color: '#1a0e02',
									background: `linear-gradient(180deg, #FFD27A, ${C.saffron})`,
									boxShadow: '0 0 28px rgba(255,181,71,0.35)',
									marginTop: 14,
								}}
							>
								தமிழ்
							</div>
						) : null}
					</div>
					<div
						style={{
							marginTop: ta ? 26 : 22,
							fontFamily: ta ? catamaran.fontFamily : inter.fontFamily,
							fontWeight: ta ? 700 : 600,
							fontSize: ta ? 46 : 50,
							lineHeight: 1.25,
							color: 'rgba(234,251,253,0.86)',
							letterSpacing: ta ? 0 : 0.2,
						}}
					>
						{ta ? (
							<>
								தினசரி விஷயங்கள் எப்படி வேலை செய்யுது?
								<br />
								<span style={{color: C.cyan}}>ஒரு நிமிஷத்துல!</span>
							</>
						) : (
							<>
								How everyday things <span style={{color: C.cyan}}>actually</span> work.
								<br />
								Explained in under a minute.
							</>
						)}
					</div>
					<div style={{marginTop: 22, display: 'flex', gap: 16, alignItems: 'center'}}>
						{(ta ? ['அறிவியல்', 'டெக்', 'உடல்', 'இயற்கை'] : ['Science', 'Tech', 'Body', 'Nature']).map((t, i) => (
							<div
								key={t}
								style={{
									fontFamily: ta ? catamaran.fontFamily : inter.fontFamily,
									fontWeight: ta ? 800 : 800,
									fontSize: ta ? 32 : 28,
									letterSpacing: ta ? 0 : 3,
									textTransform: ta ? 'none' : 'uppercase',
									color: i === 0 ? '#03161c' : C.cyan,
									background: i === 0 ? C.cyan : 'rgba(125,249,255,0.08)',
									border: `2px solid ${i === 0 ? C.cyan : 'rgba(125,249,255,0.45)'}`,
									borderRadius: 999,
									padding: ta ? '8px 24px 2px' : '9px 24px',
								}}
							>
								{t}
							</div>
						))}
					</div>
				</div>
			</div>
			{showSafe ? (
				<>
					<div style={{position: 'absolute', left: (2560 - SAFE_W) / 2, top: (1440 - SAFE_H) / 2, width: SAFE_W, height: SAFE_H, border: '4px dashed #ff4a2e'}} />
					<div style={{position: 'absolute', left: 0, top: (1440 - SAFE_H) / 2, width: 2560, height: SAFE_H, border: '3px dashed #ffd27a'}} />
				</>
			) : null}
		</AbsoluteFill>
	);
};
