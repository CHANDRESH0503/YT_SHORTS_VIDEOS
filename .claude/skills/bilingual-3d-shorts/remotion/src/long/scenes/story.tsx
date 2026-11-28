import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Bg, C, Center, Coin, Label, Panel, Person, SceneProps, clamp, ease, eout, fmt, font, glow, lerp, rnd, sp, tr} from '../kit';

// date card flipping in. p: {d, sub, red}
export const Calendar: React.FC<SceneProps> = ({p, lang, f}) => {
	const s = sp(f, 0, 11, 150);
	const c = p.red ? C.red : C.cyan;
	return (
		<AbsoluteFill>
			<Bg f={f} tint={p.red ? '#2a0b16' : C.bg1} />
			<Center style={{flexDirection: 'column', gap: 34, marginTop: -60, perspective: 1400}}>
				<div style={{transform: `rotateX(${(1 - s) * 80}deg)`, transformOrigin: '50% 0%', padding: '40px 90px', borderRadius: 30, background: C.panel,
					border: `4px solid ${c}`, boxShadow: glow(c, 26)}}>
					<div style={{fontFamily: font(lang, 'mono'), fontWeight: 800, fontSize: lang === 'ta' ? 110 : 140, color: C.white, letterSpacing: '0.02em'}}>{tr(p.d, lang)}</div>
				</div>
				<Label lang={lang} size={54} color={c} style={{opacity: clamp((f - 8) / 10)}}>{tr(p.sub, lang)}</Label>
			</Center>
		</AbsoluteFill>
	);
};

// black typewriter text card
export const Card: React.FC<SceneProps> = ({p, lang, f, full}) => {
	const t = tr(p.t, lang);
	const n = Math.floor(clamp(f / Math.min(full * 0.55, 40)) * t.length);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Center>
				<div style={{fontFamily: font(lang, 'mono'), fontWeight: 800, fontSize: lang === 'ta' ? 76 : 96, color: '#F4F1E8', whiteSpace: 'pre-line',
					textAlign: 'center', lineHeight: 1.3, maxWidth: 1500}}>
					{t.slice(0, n)}
					<span style={{opacity: Math.floor(f / 8) % 2 ? 0 : 1, color: C.orange}}>▌</span>
				</div>
			</Center>
		</AbsoluteFill>
	);
};

export const Question: React.FC<SceneProps> = ({p, lang, f}) => {
	const s = sp(f, 0, 8, 120);
	return (
		<AbsoluteFill>
			<Bg f={f} />
			<Center style={{flexDirection: 'column'}}>
				<div style={{fontFamily: font('en'), fontWeight: 700, fontSize: 420, color: C.orange, textShadow: glow(C.orange, 40), lineHeight: 1,
					transform: `scale(${0.5 + 0.5 * s}) rotate(${(1 - s) * -20 + Math.sin(f / 10) * 3}deg)`}}>?</div>
				<Label lang={lang} size={90} style={{marginTop: -10, opacity: clamp(s * 1.5)}}>{tr(p.t, lang)}</Label>
			</Center>
		</AbsoluteFill>
	);
};

// key term defined
export const Word: React.FC<SceneProps> = ({p, lang, f}) => {
	const t = tr(p.t, lang);
	return (
		<AbsoluteFill>
			<Bg f={f} />
			<Center style={{flexDirection: 'column', gap: 40, marginTop: -60}}>
				<div style={{display: 'flex', gap: lang === 'ta' ? 0 : 6}}>
					{(lang === 'ta' ? [t] : t.split('')).map((ch, i) => {
						const s = sp(f, i * 1.5, 12, 200);
						return <span key={i} style={{fontFamily: font(lang), fontWeight: 700, fontSize: lang === 'ta' ? 120 : t.length > 12 ? 120 : 150, color: C.cyan,
							textShadow: glow(C.cyan, 24), display: 'inline-block', transform: `translateY(${(1 - s) * 60}px)`, opacity: clamp(s * 1.4), whiteSpace: 'pre'}}>{ch}</span>;
					})}
				</div>
				<div style={{width: 700 * eout(clamp((f - 10) / 20)), height: 4, background: C.cyan, boxShadow: glow(C.cyan, 10)}} />
				<Label lang={lang} size={56} color={C.white} style={{opacity: clamp((f - 14) / 10)}}>{tr(p.sub, lang)}</Label>
			</Center>
		</AbsoluteFill>
	);
};

export const Confetti: React.FC<SceneProps> = ({p, lang, f}) => (
	<AbsoluteFill>
		<Bg f={f} tint="#082a20" />
		{Array.from({length: 90}).map((_, i) => {
			const x = rnd(i) * 1920 + Math.sin(f / 10 + i) * 30;
			const y = ((rnd(i + 1) * 1200 + f * (4 + rnd(i + 2) * 6)) % 1250) - 100;
			const c = [C.orange, C.gold, C.green, C.cyan][i % 4];
			return <div key={i} style={{position: 'absolute', left: x, top: y, width: 16, height: 28, background: c, transform: `rotate(${f * 6 + i * 40}deg)`, opacity: 0.85}} />;
		})}
		<Center>
			<div style={{fontFamily: font(lang), fontWeight: 700, fontSize: lang === 'ta' ? 100 : 130, color: C.gold, textShadow: glow(C.gold, 30), transform: `scale(${sp(f, 0, 8, 140)})`, textAlign: 'center'}}>
				{tr(p.t, lang)}
			</div>
		</Center>
	</AbsoluteFill>
);

// field of trader dots blinking out
export const Crowd: React.FC<SceneProps> = ({p, lang, f, full}) => {
	const n = 240;
	const u = clamp(f / (full * 0.85));
	return (
		<AbsoluteFill>
			<Bg f={f} tint="#2a0b16" />
			<svg width={1920} height={1080} style={{position: 'absolute'}}>
				{Array.from({length: n}).map((_, i) => {
					const cx = 200 + (i % 24) * 66 + (Math.floor(i / 24) % 2) * 33;
					const cy = 190 + Math.floor(i / 24) * 62;
					const gone = rnd(i) < u * 0.92;
					return <Person key={i} x={cx} y={cy + 40} s={0.55} color={gone ? C.red : C.cyan} o={gone ? 0.18 : 0.9} />;
				})}
			</svg>
			<div style={{position: 'absolute', bottom: 270, width: '100%', textAlign: 'center'}}>
				<Label lang={lang} size={58} style={{textShadow: '0 4px 20px #000'}}>{tr(p.label, lang)}</Label>
			</div>
		</AbsoluteFill>
	);
};

export const Clock: React.FC<SceneProps> = ({p, lang, f}) => {
	const sp_ = p.fast ? 30 : 12;
	return (
		<AbsoluteFill>
			<Bg f={f} />
			<Center style={{flexDirection: 'column', gap: 40, marginTop: -60}}>
				<svg width={460} height={460}>
					<circle cx={230} cy={230} r={200} fill="none" stroke={C.white} strokeWidth={12} />
					{Array.from({length: 12}).map((_, i) => {
						const a = (i / 12) * Math.PI * 2;
						return <line key={i} x1={230 + Math.sin(a) * 170} y1={230 - Math.cos(a) * 170} x2={230 + Math.sin(a) * 190} y2={230 - Math.cos(a) * 190} stroke={C.dim} strokeWidth={6} />;
					})}
					<line x1={230} y1={230} x2={230 + Math.sin((f * sp_ * Math.PI) / 180) * 160} y2={230 - Math.cos((f * sp_ * Math.PI) / 180) * 160} stroke={C.red} strokeWidth={10} strokeLinecap="round" />
					<line x1={230} y1={230} x2={230 + Math.sin((f * sp_ * Math.PI) / 2160) * 110} y2={230 - Math.cos((f * sp_ * Math.PI) / 2160) * 110} stroke={C.white} strokeWidth={12} strokeLinecap="round" />
					<circle cx={230} cy={230} r={16} fill={C.red} />
				</svg>
				<Label lang={lang} size={64} color={C.red} style={{textShadow: glow(C.red, 14)}}>{tr(p.label, lang)}</Label>
			</Center>
		</AbsoluteFill>
	);
};

export const Arrows: React.FC<SceneProps> = ({p, lang, f}) => (
	<AbsoluteFill>
		<Bg f={f} tint="#082a20" />
		{Array.from({length: 14}).map((_, i) => {
			const x = 120 + i * 125;
			const y = 1100 - ((f * (6 + rnd(i) * 6) + rnd(i + 1) * 900) % 1300);
			return <div key={i} style={{position: 'absolute', left: x, top: y, fontSize: 80 + rnd(i) * 60, color: C.green, opacity: 0.6, textShadow: glow(C.green, 14)}}>▲</div>;
		})}
		<Center>
			<Label lang={lang} size={100} color={C.white} style={{textShadow: '0 6px 30px #000'}}>{tr(p.t, lang)}</Label>
		</Center>
	</AbsoluteFill>
);

// government vault filling with seized coins
export const Reserve: React.FC<SceneProps> = ({lang, f}) => (
	<AbsoluteFill>
		<Bg f={f} />
		<svg width={1920} height={1080} style={{position: 'absolute'}}>
			<g transform="translate(960, 260)">
				<polygon points="-380,0 0,-150 380,0" fill="none" stroke={C.white} strokeWidth={8} />
				{[-280, -140, 0, 140, 280].map((x) => <rect key={x} x={x - 26} y={20} width={52} height={380} fill="rgba(255,255,255,0.04)" stroke={C.white} strokeWidth={6} />)}
				<rect x={-400} y={400} width={800} height={40} fill="none" stroke={C.white} strokeWidth={8} />
				<text x={0} y={-36} fill={C.gold} fontSize={lang === 'ta' ? 34 : 42} textAnchor="middle" fontWeight={700} fontFamily={font(lang)}>
					{lang === 'ta' ? 'தேசிய பிட்காயின் கையிருப்பு' : 'STRATEGIC BITCOIN RESERVE'}
				</text>
			</g>
			{Array.from({length: 18}).map((_, i) => {
				const ph = (f * 0.02 + rnd(i)) % 1;
				const x = lerp(i % 2 ? 1800 : 120, 960, eout(ph));
				const y = lerp(300 + rnd(i + 2) * 400, 520, eout(ph)) - Math.sin(ph * Math.PI) * 120;
				return (
					<g key={i} transform={`translate(${x}, ${y})`} opacity={Math.sin(ph * Math.PI)}>
						<circle r={30} fill={C.orange} />
						<text y={10} fill="#1a0d00" fontSize={24} textAnchor="middle" fontWeight={800} fontFamily={font('en', 'mono')}>BTC</text>
					</g>
				);
			})}
			<text x={960} y={790} fill={C.dim} fontSize={lang === 'ta' ? 34 : 40} textAnchor="middle" fontFamily={font(lang)}>{lang === 'ta' ? 'குற்றவாளிகளிடம் பறிமுதல் செய்த காயின்கள்' : 'coins seized from criminals'}</text>
		</svg>
	</AbsoluteFill>
);

// law document stamped next to a $1 coin
export const Law: React.FC<SceneProps> = ({lang, f}) => {
	const st = sp(f, 16, 9, 220);
	return (
		<AbsoluteFill>
			<Bg f={f} />
			<Center style={{gap: 120, marginTop: -60, flexDirection: 'row'}}>
				<div style={{width: 520, height: 680, background: '#EDE7D9', borderRadius: 10, padding: 50, position: 'relative', boxShadow: '0 30px 80px #000',
					transform: `rotate(-3deg) translateY(${(1 - sp(f, 0)) * 200}px)`}}>
					<div style={{fontFamily: font(lang), fontWeight: 700, fontSize: lang === 'ta' ? 34 : 42, color: '#222'}}>{lang === 'ta' ? 'ஸ்டேபிள்காயின் சட்டம்' : 'STABLECOIN LAW'}</div>
					{Array.from({length: 11}).map((_, i) => <div key={i} style={{height: 14, width: `${60 + rnd(i) * 35}%`, background: '#b9b2a2', marginTop: 26, borderRadius: 4}} />)}
					<div style={{position: 'absolute', right: 30, bottom: 60, transform: `rotate(-14deg) scale(${2 - st})`, opacity: clamp(st * 2), border: `8px solid ${C.green}`,
						color: C.green, padding: '8px 24px', fontFamily: font(lang), fontWeight: 700, fontSize: lang === 'ta' ? 40 : 54, borderRadius: 10}}>{lang === 'ta' ? 'சட்டமானது' : 'SIGNED'}</div>
				</div>
				<div style={{transform: `rotateY(${f * 6}deg)`}}><Coin label="$1" size={300} color={C.green} /></div>
			</Center>
		</AbsoluteFill>
	);
};

// balance scale: 1 token vs $1. p.v = token value
export const Peg: React.FC<SceneProps> = ({p, lang, f, full}) => {
	const v = p.v ?? 1;
	const u = ease(clamp((f - 6) / (full * 0.55)));
	const cur = lerp(1, v, u);
	const tilt = (1 - cur) * 40 + Math.sin(f / 8) * (v < 1 ? 1.5 : 0.6);
	const c = cur < 0.98 ? C.red : C.green;
	return (
		<AbsoluteFill>
			<Bg f={f} tint={v < 1 ? '#2a0b16' : C.bg1} />
			<svg width={1920} height={1080} style={{position: 'absolute'}}>
				<g transform="translate(960, 300)">
					<polygon points="-50,500 50,500 0,0" fill="rgba(255,255,255,0.06)" stroke={C.dim} strokeWidth={4} />
					<g transform={`rotate(${tilt})`}>
						<line x1={-520} x2={520} y1={0} y2={0} stroke={C.white} strokeWidth={10} />
						{[-1, 1].map((side) => (
							<g key={side} transform={`translate(${side * 440}, 0)`}>
								<line x1={-90} x2={0} y1={150} y2={0} stroke={C.dim} strokeWidth={3} />
								<line x1={90} x2={0} y1={150} y2={0} stroke={C.dim} strokeWidth={3} />
								<g transform={`rotate(${-tilt}) translate(0, 150)`}>
									<path d="M-130,0 Q0,70 130,0 Z" fill="rgba(255,255,255,0.1)" stroke={C.white} strokeWidth={5} />
									<foreignObject x={-90} y={-180} width={180} height={180}>
										<Coin label={side < 0 ? 'TOKEN' : '$1'} size={170} color={side < 0 ? c : C.green} />
									</foreignObject>
								</g>
							</g>
						))}
					</g>
				</g>
				<text x={960} y={160} fill={c} fontSize={96} textAnchor="middle" fontWeight={800} fontFamily={font('en', 'mono')} style={{filter: `drop-shadow(0 0 14px ${c})`}}>
					1 TOKEN = ${cur.toFixed(2)}
				</text>
			</svg>
		</AbsoluteFill>
	);
};

// cracks spreading over glass
export const Cracks: React.FC<SceneProps> = ({lang, f, full}) => {
	const u = eout(clamp(f / (full * 0.6)));
	const lines: string[] = [];
	for (let k = 0; k < 9; k++) {
		let x = 960, y = 470;
		let d = `M${x},${y}`;
		const ang = (k / 9) * Math.PI * 2 + rnd(k) * 0.5;
		for (let s = 0; s < 8; s++) {
			const a = ang + (rnd(k * 10 + s) - 0.5) * 0.9;
			x += Math.cos(a) * 110;
			y += Math.sin(a) * 110;
			d += ` L${x.toFixed(0)},${y.toFixed(0)}`;
		}
		lines.push(d);
	}
	return (
		<AbsoluteFill>
			<Bg f={f} tint="#082a20" />
			<svg width={1920} height={1080} style={{position: 'absolute'}}>
				<text x={960} y={500} fill={C.green} fontSize={130} fontWeight={800} textAnchor="middle" fontFamily={font('en', 'mono')} opacity={0.5}>2025 ▲</text>
				{lines.map((d, i) => <path key={i} d={d} stroke="#fff" strokeWidth={4} fill="none" strokeDasharray={900} strokeDashoffset={900 * (1 - u)} opacity={0.85} />)}
			</svg>
			<div style={{position: 'absolute', bottom: 270, width: '100%', textAlign: 'center'}}>
				<Label lang={lang} size={60}>{lang === 'ta' ? 'விரிசல்கள்' : 'the cracks'}</Label>
			</div>
		</AbsoluteFill>
	);
};

// vault drained by a hooded silhouette
export const Hack: React.FC<SceneProps> = ({lang, f}) => (
	<AbsoluteFill>
		<Bg f={f} tint="#160b2a" />
		<svg width={1920} height={1080} style={{position: 'absolute'}}>
			<g transform="translate(560, 500)">
				<rect x={-230} y={-260} width={460} height={520} rx={30} fill="rgba(255,255,255,0.04)" stroke={C.cyan} strokeWidth={8} />
				<circle r={130} fill="none" stroke={C.cyan} strokeWidth={10} />
				<g transform={`rotate(${f * 4})`}>{[0, 1, 2, 3].map((i) => <line key={i} x1={0} y1={0} x2={Math.cos(i * 1.57) * 110} y2={Math.sin(i * 1.57) * 110} stroke={C.cyan} strokeWidth={8} />)}</g>
				<text y={320} fill={C.dim} fontSize={36} textAnchor="middle" fontFamily={font(lang)}>{lang === 'ta' ? 'எக்ஸ்சேஞ்ச் வாலட்' : 'exchange wallet'}</text>
			</g>
			{Array.from({length: 26}).map((_, i) => {
				const ph = (f * 0.03 + rnd(i)) % 1;
				const x = lerp(700, 1360, ph);
				const y = 480 + Math.sin(ph * Math.PI) * -120 + (rnd(i + 1) - 0.5) * 120;
				return <g key={i} transform={`translate(${x},${y})`} opacity={Math.sin(ph * Math.PI)}><circle r={22} fill={C.violet} /><text y={8} fill="#fff" fontSize={18} textAnchor="middle" fontWeight={800} fontFamily={font('en', 'mono')}>ETH</text></g>;
			})}
			<g transform="translate(1460, 520)">
				<path d="M-120,200 Q-130,-40 0,-120 Q130,-40 120,200 Z" fill="#05040a" stroke={C.red} strokeWidth={5} />
				<ellipse cx={0} cy={-30} rx={60} ry={70} fill="#000" />
				<circle cx={-20} cy={-30} r={7} fill={C.red} /><circle cx={20} cy={-30} r={7} fill={C.red} />
			</g>
			<text x={1460} y={800} fill={C.red} fontSize={lang === 'ta' ? 34 : 40} textAnchor="middle" fontWeight={700} fontFamily={font(lang)}>{lang === 'ta' ? 'வட கொரியா தொடர்புடைய ஹேக்கர்கள்' : 'hackers linked to North Korea'}</text>
			<text x={960} y={150} fill={C.white} fontSize={48} textAnchor="middle" fontWeight={700} fontFamily={font(lang, 'mono')}>{lang === 'ta' ? 'பிப் 21, 2025' : 'FEB 21, 2025'}</text>
		</svg>
	</AbsoluteFill>
);

// a falling coin caught by many hands (buy the dip)
export const Catch: React.FC<SceneProps> = ({lang, f, full}) => {
	const ph = (f % 45) / 45;
	const y = ph < 0.6 ? lerp(120, 560, ph / 0.6) : lerp(560, 480, Math.sin(((ph - 0.6) / 0.4) * Math.PI));
	return (
		<AbsoluteFill>
			<Bg f={f} tint="#082a20" />
			<svg width={1920} height={1080} style={{position: 'absolute'}}>
				{Array.from({length: 11}).map((_, i) => <Person key={i} x={560 + i * 80} y={820} s={1.3} color={C.green} arms={ph > 0.55 ? 40 : 20} />)}
			</svg>
			<div style={{position: 'absolute', left: 900, top: y}}><Coin label="BTC" size={130} /></div>
			<div style={{position: 'absolute', top: 120, width: '100%', textAlign: 'center'}}>
				<Label lang={lang} size={52} color={C.green}>{lang === 'ta' ? 'ஒவ்வொரு சரிவும் வாங்கப்பட்டது' : 'every dip got bought'}</Label>
			</div>
		</AbsoluteFill>
	);
};

// iceberg: the record on top, leverage hidden below
export const Iceberg: React.FC<SceneProps> = ({p, lang, f}) => {
	const r = p.reveal ? sp(f, 4, 14, 90) : 0;
	const cam = p.reveal ? -260 * r : 0;
	return (
		<AbsoluteFill>
			<AbsoluteFill style={{background: 'linear-gradient(#0B1630 0%, #0B1630 46%, #031522 46.2%, #01070d 100%)'}} />
			<svg width={1920} height={1080} style={{position: 'absolute', transform: `translateY(${cam}px)`}}>
				<polygon points="760,500 900,300 960,240 1030,320 1160,500" fill="#dff6ff" style={{filter: `drop-shadow(0 0 20px ${C.cyan})`}} />
				<polygon points="620,500 1300,500 1460,820 1250,1150 700,1180 480,860" fill={`${C.cyan}33`} stroke={C.cyan} strokeWidth={4} opacity={0.4 + 0.6 * r} />
				{Array.from({length: 6}).map((_, i) => <line key={i} x1={0} x2={1920} y1={500 + Math.sin(f / 10 + i) * 4} y2={500 + Math.sin(f / 10 + i) * 4} stroke={C.cyan} strokeOpacity={0.15} />)}
				<text x={960} y={200} fill={C.gold} fontSize={lang === 'ta' ? 48 : 56} textAnchor="middle" fontWeight={700} fontFamily={font(lang)}>{lang === 'ta' ? 'சாதனை விலை $126k' : 'record price $126k'}</text>
				<text x={960} y={780} fill={C.red} fontSize={lang === 'ta' ? 66 : 80} textAnchor="middle" fontWeight={700} fontFamily={font(lang)} opacity={r}
					style={{filter: `drop-shadow(0 0 16px ${C.red})`}}>{lang === 'ta' ? 'சாதனை அளவு கடன் பந்தயங்கள்' : 'record borrowed bets'}</text>
				<text x={960} y={840} fill={C.dim} fontSize={40} textAnchor="middle" fontFamily={font(lang)} opacity={r}>{lang === 'ta' ? 'யாரும் பேசவில்லை' : 'nobody talking about it'}</text>
			</svg>
		</AbsoluteFill>
	);
};

// sell -> lower price -> liquidation loop
export const Loop: React.FC<SceneProps> = ({lang, f}) => {
	const items = lang === 'ta' ? ['கட்டாய விற்பனை', 'விலை இறங்கும்', 'அடுத்த லிக்விடேஷன்'] : ['forced sale', 'price drops', 'next liquidation'];
	const act = Math.floor(f / 18) % 3;
	return (
		<AbsoluteFill>
			<Bg f={f} tint="#2a0b16" />
			<svg width={1920} height={1080} style={{position: 'absolute'}}>
				<g transform="translate(960, 500)">
					<circle r={300} fill="none" stroke={C.red} strokeOpacity={0.3} strokeWidth={6} strokeDasharray="20 16" strokeDashoffset={-f * 4} />
					{items.map((t, i) => {
						const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
						const on = i === act;
						return (
							<g key={i} transform={`translate(${Math.cos(a) * 300}, ${Math.sin(a) * 300}) scale(${on ? 1.12 : 1})`}>
								<rect x={-220} y={-55} width={440} height={110} rx={55} fill={on ? C.red : C.panel} stroke={C.red} strokeWidth={4} />
								<text y={14} fill="#fff" fontSize={lang === 'ta' ? 34 : 42} textAnchor="middle" fontWeight={700} fontFamily={font(lang)}>{t}</text>
							</g>
						);
					})}
					<text y={20} fill={C.red} fontSize={90} textAnchor="middle" fontFamily={font('en', 'mono')} style={{transform: `rotate(${f * 4}deg)`}}>↻</text>
				</g>
			</svg>
		</AbsoluteFill>
	);
};

// a line of glowing dominoes. p: {fall, long, finger}
export const Domino: React.FC<SceneProps> = ({p, lang, f, full}) => {
	const n = p.long ? 16 : 10;
	const u = clamp(f / (full * 0.9));
	const front = p.fall ? u * (n + 2) : -1;
	const gap = p.long ? 100 : 150;
	const x0 = 960 - ((n - 1) * gap) / 2;
	return (
		<AbsoluteFill>
			<Bg f={f} tint={p.fall ? '#2a0b16' : C.bg1} />
			<svg width={1920} height={1080} style={{position: 'absolute'}}>
				<line x1={0} x2={1920} y1={780} y2={780} stroke={C.line} strokeWidth={4} />
				{Array.from({length: n}).map((_, i) => {
					const t = clamp(front - i);
					const ang = 72 * eout(t);
					const h = p.long ? 220 : 260;
					const c = t > 0 ? C.red : C.cyan;
					const price = 126 - i * (p.long ? 1.5 : 2.2);
					return (
						<g key={i} transform={`translate(${x0 + i * gap}, 780) rotate(${ang})`}>
							<rect x={-24} y={-h} width={48} height={h} rx={8} fill={`${c}33`} stroke={c} strokeWidth={4} style={{filter: `drop-shadow(0 0 10px ${c})`}} />
							<text x={0} y={-h - 18} fill={c} fontSize={24} textAnchor="middle" fontFamily={font('en', 'mono')} transform={`rotate(${-ang}, 0, ${-h - 18})`}>${price.toFixed(0)}k</text>
						</g>
					);
				})}
				{p.finger ? (
					<g transform={`translate(${x0 - 160 + Math.sin(f / 6) * 20}, 640)`}>
						<rect x={-140} y={-24} width={150} height={48} rx={24} fill={C.gold} />
						<text x={-230} y={14} fill={C.gold} fontSize={42} fontWeight={700} fontFamily={font(lang)} textAnchor="end">{lang === 'ta' ? 'ஒரு தள்ளு?' : 'one push?'}</text>
					</g>
				) : null}
			</svg>
		</AbsoluteFill>
	);
};

// generic breaking-news alert (no real platform UI)
export const Post: React.FC<SceneProps> = ({lang, f}) => {
	const s = sp(f, 0, 10, 150);
	return (
		<AbsoluteFill>
			<Bg f={f} tint="#2a0b16" />
			<Center style={{marginTop: -60}}>
				<div style={{transform: `scale(${0.6 + 0.4 * s}) rotate(${(1 - s) * 6}deg)`, opacity: clamp(s * 1.5)}}>
					<div style={{background: C.red, color: '#fff', fontFamily: font(lang), fontWeight: 700, fontSize: 40, padding: '14px 36px', display: 'inline-block',
						borderRadius: '16px 16px 0 0', letterSpacing: '0.1em', opacity: Math.floor(f / 10) % 2 ? 1 : 0.75}}>{lang === 'ta' ? 'அவசரச் செய்தி' : 'BREAKING'}</div>
					<Panel style={{width: 1300, padding: 56, borderRadius: '0 26px 26px 26px', borderColor: C.red}}>
						<div style={{fontFamily: font(lang), fontWeight: 700, fontSize: lang === 'ta' ? 62 : 76, color: C.white, lineHeight: 1.2}}>
							{lang === 'ta' ? 'அமெரிக்கா: சீனப் பொருட்களுக்கு 100% வரி, நவம்பர் 1 முதல்' : 'US threatens a 100% tariff on goods from China, from Nov 1'}
						</div>
						<div style={{fontFamily: font(lang, 'mono'), fontSize: 34, color: C.dim, marginTop: 30}}>{lang === 'ta' ? 'வெள்ளி, அக் 10 · மாலை' : 'FRI OCT 10 · EVENING'}</div>
					</Panel>
				</div>
			</Center>
		</AbsoluteFill>
	);
};

// two nodes joined by a tariff arc
export const Globe: React.FC<SceneProps> = ({lang, f, full}) => {
	const u = eout(clamp(f / (full * 0.6)));
	return (
		<AbsoluteFill>
			<Bg f={f} />
			<svg width={1920} height={1080} style={{position: 'absolute'}}>
				<circle cx={960} cy={520} r={380} fill="none" stroke={C.line} strokeWidth={3} />
				<ellipse cx={960} cy={520} rx={380} ry={130} fill="none" stroke={C.line} strokeWidth={2} />
				<ellipse cx={960} cy={520} rx={150} ry={380} fill="none" stroke={C.line} strokeWidth={2} transform={`rotate(${f * 0.4}, 960, 520)`} />
				<circle cx={640} cy={520} r={40} fill={C.cyan} style={{filter: `drop-shadow(0 0 16px ${C.cyan})`}} />
				<circle cx={1280} cy={520} r={40} fill={C.red} style={{filter: `drop-shadow(0 0 16px ${C.red})`}} />
				<text x={640} y={610} fill={C.cyan} fontSize={44} textAnchor="middle" fontWeight={700} fontFamily={font(lang)}>{lang === 'ta' ? 'அமெரிக்கா' : 'USA'}</text>
				<text x={1280} y={610} fill={C.red} fontSize={44} textAnchor="middle" fontWeight={700} fontFamily={font(lang)}>{lang === 'ta' ? 'சீனா' : 'CHINA'}</text>
				<path d="M640,480 Q960,140 1280,480" fill="none" stroke={C.gold} strokeWidth={8} strokeDasharray={900} strokeDashoffset={900 * (1 - u)} style={{filter: `drop-shadow(0 0 10px ${C.gold})`}} />
				<g transform="translate(960, 300)" opacity={u}>
					<rect x={-150} y={-56} width={300} height={100} rx={20} fill={C.gold} />
					<text y={18} fill="#2a1a00" fontSize={60} textAnchor="middle" fontWeight={800} fontFamily={font('en', 'mono')}>100%</text>
				</g>
			</svg>
		</AbsoluteFill>
	);
};

// stock exchange shutters closing for the weekend
export const Closed: React.FC<SceneProps> = ({lang, f, full}) => {
	const u = eout(clamp(f / (full * 0.6)));
	return (
		<AbsoluteFill>
			<Bg f={f} />
			<Center style={{marginTop: -60}}>
				<div style={{width: 1000, height: 560, position: 'relative', border: `6px solid ${C.dim}`, borderRadius: 20, overflow: 'hidden', background: C.panel}}>
					<div style={{position: 'absolute', inset: 40, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14}}>
						{Array.from({length: 12}).map((_, i) => <div key={i} style={{background: rnd(i) > 0.5 ? `${C.green}44` : `${C.red}44`, borderRadius: 8}} />)}
					</div>
					<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: `${u * 100}%`,
						background: 'repeating-linear-gradient(#2a3346 0 26px, #1b2232 26px 30px)', borderBottom: `8px solid ${C.dim}`}} />
					<div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: clamp(u * 2 - 1)}}>
						<div style={{fontFamily: font(lang), fontWeight: 700, fontSize: lang === 'ta' ? 70 : 90, color: C.white, background: 'rgba(0,0,0,0.6)', padding: '10px 40px', borderRadius: 14}}>
							{lang === 'ta' ? 'ஸ்டாக் மார்க்கெட்: மூடல்' : 'STOCKS: CLOSED'}
						</div>
					</div>
				</div>
			</Center>
		</AbsoluteFill>
	);
};

export const Open247: React.FC<SceneProps> = ({lang, f}) => {
	const fl = 0.75 + 0.25 * Math.abs(Math.sin(f / 5));
	return (
		<AbsoluteFill>
			<Bg f={f} tint="#160b2a" />
			<Center style={{flexDirection: 'column', gap: 30, marginTop: -60}}>
				<div style={{fontFamily: font('en', 'mono'), fontWeight: 800, fontSize: 260, color: C.cyan, textShadow: glow(C.cyan, 40), opacity: fl, border: `10px solid ${C.cyan}`,
					padding: '0 60px', borderRadius: 40, boxShadow: glow(C.cyan, 30)}}>24/7</div>
				<Label lang={lang} size={70}>{lang === 'ta' ? 'கிரிப்டோ எப்போதும் திறந்திருக்கும்' : 'crypto never closes'}</Label>
			</Center>
		</AbsoluteFill>
	);
};

// liquidation feed scrolling fast
export const Ticker: React.FC<SceneProps> = ({lang, f}) => {
	const rows = 13;
	return (
		<AbsoluteFill>
			<Bg f={f} tint="#2a0b16" />
			<div style={{position: 'absolute', left: 300, right: 300, top: 120, bottom: 160, overflow: 'hidden', maskImage: 'linear-gradient(transparent, black 15%, black 85%, transparent)'}}>
				{Array.from({length: rows + 2}).map((_, j) => {
					const i = j + Math.floor(f / 2);
					const y = j * 64 - ((f * 32) % 64);
					const amt = Math.round(5 + rnd(i) * 900) * 1000;
					return (
						<div key={j} style={{position: 'absolute', top: y, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', fontFamily: font(lang, 'mono'),
							fontSize: 34, color: C.white, borderBottom: `1px solid ${C.line}`, padding: '10px 0'}}>
							<span style={{color: C.red, fontWeight: 800}}>{lang === 'ta' ? 'லிக்விடேட்' : 'LIQUIDATED'}</span>
							<span>{['BTC', 'ETH', 'A03', 'A07', 'A11', 'A02'][i % 6]} {lang === 'ta' ? 'லாங்' : 'LONG'} {[10, 20, 25, 50, 100][i % 5]}x</span>
							<span style={{color: C.red}}>−${fmt(amt)}</span>
						</div>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};

// automated engine outrunning a human hand
export const Robot: React.FC<SceneProps> = ({lang, f}) => (
	<AbsoluteFill>
		<Bg f={f} />
		<Center style={{gap: 160, marginTop: -60, flexDirection: 'row'}}>
			<div style={{textAlign: 'center'}}>
				<div style={{width: 320, height: 320, borderRadius: '50%', border: `10px solid ${C.cyan}`, boxShadow: glow(C.cyan, 20), position: 'relative', transform: `rotate(${f * 24}deg)`}}>
					{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} style={{position: 'absolute', left: 150, top: 10, width: 20, height: 300, background: `${C.cyan}55`, transform: `rotate(${i * 30}deg)`}} />)}
				</div>
				<Label lang={lang} size={46} color={C.cyan} style={{marginTop: 30}}>{lang === 'ta' ? 'இயந்திரம்: மில்லி விநாடிகள்' : 'machines: milliseconds'}</Label>
			</div>
			<div style={{textAlign: 'center'}}>
				<svg width={300} height={320}><Person x={150} y={250} s={3} color={C.dim} arms={Math.sin(f / 10) * 10} /></svg>
				<Label lang={lang} size={46} color={C.dim} style={{marginTop: 30}}>{lang === 'ta' ? 'மனிதர்: வினாடிகள்' : 'humans: seconds'}</Label>
			</div>
		</Center>
	</AbsoluteFill>
);

// order book depth bars. p: {thin 0..1, eat, empty}
export const Book: React.FC<SceneProps> = ({p, lang, f, full}) => {
	const u = clamp(f / (full * 0.8));
	const thin = p.thin ?? 0;
	const fade = thin >= 1 ? 1 : thin;
	const rows = 10;
	const eat = p.eat ? eout(u) : 0;
	return (
		<AbsoluteFill>
			<Bg f={f} tint={thin > 0.5 ? '#2a0b16' : C.bg1} />
			<div style={{position: 'absolute', left: 260, right: 260, top: 150}}>
				<div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 20}}>
					<Label lang={lang} size={38} color={C.green}>{lang === 'ta' ? 'வாங்கக் காத்திருப்பவர்கள்' : 'BUYERS WAITING'}</Label>
					<Label lang={lang} size={38} color={C.red}>{lang === 'ta' ? 'விற்பவர்கள்' : 'SELLERS'}</Label>
				</div>
				{Array.from({length: rows}).map((_, i) => {
					const base = 0.35 + rnd(i) * 0.55;
					const pulled = thin === 0 ? 0 : clamp(thin >= 1 && !p.empty ? 1 - (thin === 1 ? 0.04 : 0) : lerp(0, thin, eout(clamp(u * 1.4 - i * 0.05))));
					const bw = base * (1 - (thin >= 1 ? 0.96 : pulled)) * (i / rows < eat ? 0 : 1);
					const sw = (0.3 + rnd(i + 20) * 0.5) * (p.eat ? 1 + eat : 1);
					return (
						<div key={i} style={{display: 'flex', alignItems: 'center', height: 54, marginBottom: 8}}>
							<div style={{flex: 1, display: 'flex', justifyContent: 'flex-end'}}>
								<div style={{width: `${bw * 100}%`, height: 44, background: `linear-gradient(270deg, ${C.green}, ${C.green}44)`, borderRadius: 6}} />
							</div>
							<div style={{width: 160, textAlign: 'center', fontFamily: font('en', 'mono'), fontSize: 26, color: C.dim}}>{fmt(121 - i * 0.6, 1)}k</div>
							<div style={{flex: 1}}>
								<div style={{width: `${Math.min(1, sw) * 100}%`, height: 44, background: `linear-gradient(90deg, ${C.red}, ${C.red}44)`, borderRadius: 6}} />
							</div>
						</div>
					);
				})}
			</div>
			{thin >= 1 || p.empty ? (
				<div style={{position: 'absolute', left: 0, right: 0, top: 380, textAlign: 'center', fontFamily: font(lang), fontWeight: 700, fontSize: lang === 'ta' ? 64 : 84, color: '#fff',
					textShadow: `0 0 30px #000, 0 0 60px #000, ${glow(C.red, 18)}`, opacity: clamp((f - 8) / 10)}}>{p.eat ? (lang === 'ta' ? 'தரை இல்லை' : 'no floor') : lang === 'ta' ? 'வாங்குபவர்கள் காணோம்' : 'the buyers vanished'}</div>
			) : null}
		</AbsoluteFill>
	);
};

// market makers as springs under the price platform; p.pull = pulled away
export const Shock: React.FC<SceneProps> = ({p, lang, f, full}) => {
	const pull = p.pull ? eout(clamp((f - 8) / (full * 0.45))) : 0;
	const drop = p.pull ? Math.pow(clamp((f - full * 0.5) / (full * 0.4)), 2) * 420 : Math.sin(f / 6) * 10;
	return (
		<AbsoluteFill>
			<Bg f={f} tint={p.pull ? '#2a0b16' : C.bg1} />
			<svg width={1920} height={1080} style={{position: 'absolute'}}>
				<g transform={`translate(0, ${drop})`}>
					<rect x={560} y={380} width={800} height={50} rx={12} fill={C.orange} style={{filter: `drop-shadow(0 0 14px ${C.orange})`}} />
					<text x={960} y={360} fill={C.orange} fontSize={44} textAnchor="middle" fontWeight={700} fontFamily={font(lang)}>{lang === 'ta' ? 'விலை' : 'PRICE'}</text>
				</g>
				{[0, 1, 2, 3].map((i) => {
					const x = 640 + i * 210 + (i < 2 ? -1 : 1) * pull * 700;
					const comp = Math.sin(f / 6) * 10;
					const pts = Array.from({length: 13}).map((_, k) => `${x + (k % 2 ? 30 : -30) * (k && k < 12 ? 1 : 0)},${430 + comp + (k * (330 - comp)) / 12}`).join(' ');
					return (
						<g key={i} opacity={1 - pull * 0.6}>
							<polyline points={pts} fill="none" stroke={C.cyan} strokeWidth={8} />
							<rect x={x - 60} y={760} width={120} height={40} rx={8} fill={C.cyan} />
						</g>
					);
				})}
				<text x={960} y={850} fill={C.cyan} fontSize={lang === 'ta' ? 36 : 44} textAnchor="middle" fontWeight={700} fontFamily={font(lang)}>
					{p.pull ? (lang === 'ta' ? 'மார்க்கெட் மேக்கர்கள் விலகினார்கள்' : 'market makers pull out') : lang === 'ta' ? 'மார்க்கெட் மேக்கர்கள் = ஷாக் அப்சார்பர்' : 'market makers = shock absorbers'}
				</text>
			</svg>
		</AbsoluteFill>
	);
};

// the floor giving way; p.leave = traders walking away
export const Floor: React.FC<SceneProps> = ({p, lang, f, full}) => {
	const u = clamp(f / (full * 0.7));
	const open = p.leave ? 1 : eout(u);
	return (
		<AbsoluteFill>
			<Bg f={f} tint="#2a0b16" />
			<svg width={1920} height={1080} style={{position: 'absolute'}}>
				<rect x={0} y={700} width={960 - 460 * open} height={30} fill={C.dim} />
				<rect x={960 + 460 * open} y={700} width={960} height={30} fill={C.dim} />
				<rect x={500} y={730} width={920} height={400} fill="url(#pit)" opacity={open} />
				<defs><linearGradient id="pit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" /><stop offset="1" stopColor={C.red} stopOpacity={0.4} /></linearGradient></defs>
				{p.leave ? (
					Array.from({length: 8}).map((_, i) => {
						const side = i % 2 ? 1 : -1;
						const x = 960 + side * (520 + i * 30 + f * 4);
						return <Person key={i} x={x} y={690} s={1.4} color={i % 3 ? C.dim : C.cyan} o={0.8} />;
					})
				) : (
					<g transform={`translate(960, ${560 + Math.pow(u, 2) * 300})`}>
						<circle r={60} fill={C.orange} style={{filter: `drop-shadow(0 0 20px ${C.orange})`}} />
						<text y={14} fill="#1a0d00" fontSize={40} textAnchor="middle" fontWeight={800} fontFamily={font('en', 'mono')}>BTC</text>
					</g>
				)}
				<text x={960} y={160} fill={C.white} fontSize={lang === 'ta' ? 50 : 60} textAnchor="middle" fontWeight={700} fontFamily={font(lang)}>
					{p.leave ? (lang === 'ta' ? 'பலர் திரும்பி வரவில்லை' : 'many never came back') : lang === 'ta' ? 'தரையே இல்லை' : 'through the floor'}
				</text>
			</svg>
		</AbsoluteFill>
	);
};

// a single $1 coin under a spotlight
export const CoinSpot: React.FC<SceneProps> = ({lang, f}) => {
	const wob = f > 40 ? Math.sin(f * 1.2) * clamp((f - 40) / 30) * 8 : 0;
	return (
		<AbsoluteFill style={{background: '#020309'}}>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.18) 0%, transparent 45%)'}} />
			<Center style={{flexDirection: 'column', gap: 60, marginTop: -60}}>
				<div style={{transform: `rotate(${wob}deg) rotateY(${f * 3}deg)`}}><Coin label="$1" size={340} color={C.green} /></div>
				<Label lang={lang} size={56} color={C.dim}>{lang === 'ta' ? 'அசையவே கூடாத காயின்' : 'the coin that should never move'}</Label>
			</Center>
		</AbsoluteFill>
	);
};

// exchange checking only its own tiny order book
export const Oracle: React.FC<SceneProps> = ({lang, f}) => (
	<AbsoluteFill>
		<Bg f={f} />
		<svg width={1920} height={1080} style={{position: 'absolute'}}>
			{[0, 1, 2, 3].map((i) => {
				const x = 300 + i * 440;
				const own = i === 1;
				return (
					<g key={i} opacity={own ? 1 : 0.35}>
						<rect x={x - 160} y={300} width={320} height={380} rx={20} fill={C.panel} stroke={own ? C.red : C.dim} strokeWidth={own ? 6 : 3} />
						{Array.from({length: own ? 3 : 9}).map((_, k) => <rect key={k} x={x - 130} y={330 + k * 38} width={(own ? 60 : 160) + rnd(i * 10 + k) * 90} height={26} fill={own ? `${C.red}aa` : `${C.green}aa`} rx={4} />)}
						<text x={x} y={730} fill={own ? C.red : C.dim} fontSize={lang === 'ta' ? 28 : 32} textAnchor="middle" fontWeight={700} fontFamily={font(lang)}>
							{own ? (lang === 'ta' ? 'அதன் சொந்த புக்' : 'its own thin book') : lang === 'ta' ? 'மற்ற மார்க்கெட்' : 'other markets'}
						</text>
						{own ? null : <text x={x} y={520} fill={C.green} fontSize={44} textAnchor="middle" fontWeight={800} fontFamily={font('en', 'mono')}>$1.00</text>}
					</g>
				);
			})}
			<g transform={`translate(${740 + Math.sin(f / 12) * 20}, 260)`}>
				<circle r={70} fill="none" stroke={C.gold} strokeWidth={10} />
				<line x1={50} y1={50} x2={110} y2={110} stroke={C.gold} strokeWidth={14} strokeLinecap="round" />
			</g>
			<text x={740} y={160} fill={C.red} fontSize={60} textAnchor="middle" fontWeight={800} fontFamily={font('en', 'mono')}>$0.65</text>
		</svg>
	</AbsoluteFill>
);

// an empty room with one low offer shouted
export const EmptyRoom: React.FC<SceneProps> = ({lang, f}) => (
	<AbsoluteFill style={{background: '#06080e'}}>
		<svg width={1920} height={1080} style={{position: 'absolute'}}>
			<polygon points="360,140 1560,140 1360,320 560,320" fill="#0f1422" />
			<polygon points="560,320 1360,320 1360,820 560,820" fill="#0b0f1a" stroke={C.line} strokeWidth={3} />
			<polygon points="360,140 560,320 560,820 360,980" fill="#0d1220" />
			<polygon points="1560,140 1360,320 1360,820 1560,980" fill="#0d1220" />
			<polygon points="360,980 560,820 1360,820 1560,980" fill="#111727" />
			<Person x={1150} y={800} s={2} color={C.dim} arms={30} />
			<g transform={`translate(1020, ${520 + Math.sin(f / 5) * 6}) scale(${0.9 + 0.1 * Math.abs(Math.sin(f / 7))})`}>
				<rect x={-200} y={-60} width={260} height={100} rx={30} fill={C.red} />
				<text x={-70} y={10} fill="#fff" fontSize={54} textAnchor="middle" fontWeight={800} fontFamily={font('en', 'mono')}>$0.65!</text>
			</g>
			<g transform="translate(720, 640)">
				<polygon points="-90,0 0,-80 90,0" fill="none" stroke={C.gold} strokeWidth={6} />
				<rect x={-70} y={0} width={140} height={110} fill="none" stroke={C.gold} strokeWidth={6} />
			</g>
			<text x={960} y={120} fill={C.white} fontSize={lang === 'ta' ? 38 : 44} textAnchor="middle" fontWeight={700} fontFamily={font(lang)}>
				{lang === 'ta' ? 'ஒரு காலி அறையில், ஒரே ஒரு குறைந்த விலை' : 'one empty room, one lowball offer'}
			</text>
		</svg>
	</AbsoluteFill>
);

export const Pending: React.FC<SceneProps> = ({lang, f}) => (
	<AbsoluteFill>
		<Bg f={f} />
		<Center style={{flexDirection: 'column', gap: 40, marginTop: -60}}>
			<Panel style={{width: 1100, padding: 60}}>
				<Label lang={lang} size={44}>{lang === 'ta' ? 'விலை நிர்ணய திருத்தம்: வெளிச் சந்தை விலைகள்' : 'Pricing fix: use prices from other markets'}</Label>
				<div style={{height: 30, background: 'rgba(255,255,255,0.06)', borderRadius: 15, marginTop: 40, overflow: 'hidden'}}>
					<div style={{width: `${62 + Math.sin(f / 9) * 3}%`, height: '100%', background: `repeating-linear-gradient(45deg, ${C.gold} 0 20px, #b88a1a 20px 40px)`,
						backgroundPosition: `${f * 3}px 0`}} />
				</div>
				<div style={{fontFamily: font(lang, 'mono'), fontWeight: 800, fontSize: 52, color: C.gold, marginTop: 30}}>{lang === 'ta' ? 'நிலுவையில்…' : 'PENDING…'}</div>
			</Panel>
		</Center>
	</AbsoluteFill>
);

// four seller silhouettes in a line-up; p.hi = which one is lit (-1 = all)
export const Sellers: React.FC<SceneProps> = ({p, lang, f}) => {
	const names = lang === 'ta' ? ['மத்திய வங்கி', 'ஃபண்டுகள்', 'பழைய ஹோல்டர்கள்', 'கம்பெனிகள்'] : ['the central bank', 'the funds', 'early believers', 'the companies'];
	return (
		<AbsoluteFill>
			<Bg f={f} />
			<svg width={1920} height={1080} style={{position: 'absolute'}}>
				{[0, 1, 2, 3].map((i) => {
					const on = p.hi === -1 || p.hi === i;
					const s = sp(f, i * 5, 12, 160);
					const x = 360 + i * 400;
					return (
						<g key={i} opacity={on ? 1 : 0.22} transform={`translate(0, ${(1 - s) * 200})`}>
							{on && p.hi === i ? <ellipse cx={x} cy={790} rx={160} ry={30} fill={C.red} opacity={0.4} /> : null}
							<Person x={x} y={760} s={4} color={on ? C.red : C.dim} />
							<rect x={x - 70} y={420} width={140} height={60} rx={10} fill={on ? C.red : C.dim} opacity={0.9} />
							<text x={x} y={462} fill="#fff" fontSize={34} textAnchor="middle" fontWeight={800} fontFamily={font('en', 'mono')}>#{i + 1}</text>
							<text x={x} y={845} fill={on ? C.white : C.dim} fontSize={lang === 'ta' ? 34 : 40} textAnchor="middle" fontWeight={700} fontFamily={font(lang)}>{names[i]}</text>
						</g>
					);
				})}
				<text x={960} y={160} fill={C.white} fontSize={lang === 'ta' ? 46 : 54} textAnchor="middle" fontWeight={700} fontFamily={font(lang)}>
					{lang === 'ta' ? 'நான்கு விற்பனையாளர்கள்' : 'FOUR SELLERS'}
				</text>
			</svg>
		</AbsoluteFill>
	);
};

export const FedBuilding: React.FC<SceneProps> = ({lang, f}) => (
	<AbsoluteFill>
		<Bg f={f} />
		<svg width={1920} height={1080} style={{position: 'absolute'}}>
			<g transform="translate(960, 300)">
				<polygon points="-420,0 0,-170 420,0" fill="none" stroke={C.white} strokeWidth={8} />
				{[-330, -200, -66, 66, 200, 330].map((x) => <rect key={x} x={x - 26} y={20} width={52} height={400} fill="rgba(255,255,255,0.04)" stroke={C.white} strokeWidth={6} />)}
				<rect x={-440} y={420} width={880} height={40} fill="none" stroke={C.white} strokeWidth={8} />
				<text y={-50} fill={C.gold} fontSize={lang === 'ta' ? 34 : 40} textAnchor="middle" fontWeight={700} fontFamily={font(lang)}>{lang === 'ta' ? 'அமெரிக்க ஃபெடரல் ரிசர்வ்' : 'FEDERAL RESERVE'}</text>
			</g>
			<g transform={`translate(1500, 380) scale(${sp(f, 10)})`}>
				<rect x={-200} y={-80} width={400} height={150} rx={30} fill={C.panel} stroke={C.gold} strokeWidth={4} />
				<text y={-10} fill={C.gold} fontSize={lang === 'ta' ? 32 : 38} textAnchor="middle" fontWeight={700} fontFamily={font(lang)}>{lang === 'ta' ? 'டிசம்பர் குறைப்பு?' : '"December cut?'}</text>
				<text y={40} fill={C.gold} fontSize={lang === 'ta' ? 30 : 36} textAnchor="middle" fontWeight={700} fontFamily={font(lang)}>{lang === 'ta' ? 'உறுதி இல்லை' : 'far from certain"'}</text>
			</g>
		</svg>
	</AbsoluteFill>
);

// money tap open/closed
export const Tap: React.FC<SceneProps> = ({p, lang, f}) => {
	const open = p.open;
	return (
		<AbsoluteFill>
			<Bg f={f} tint={open ? '#082a20' : '#2a0b16'} />
			<svg width={1920} height={1080} style={{position: 'absolute'}}>
				<rect x={600} y={240} width={500} height={70} rx={20} fill={C.dim} />
				<rect x={1040} y={240} width={80} height={180} rx={20} fill={C.dim} />
				<rect x={820} y={170} width={60} height={80} fill={C.dim} />
				<rect x={720} y={150} width={260} height={30} rx={14} fill={open ? C.green : C.red} transform={`rotate(${open ? 0 : 90}, 850, 165)`} />
				{open ? Array.from({length: 24}).map((_, i) => {
					const y = 440 + ((f * 9 + i * 40) % 460);
					return <text key={i} x={1080 + (rnd(i) - 0.5) * 60} y={y} fill={C.green} fontSize={44} fontWeight={800} textAnchor="middle" fontFamily={font('en', 'mono')}>$</text>;
				}) : <circle cx={1080} cy={440 + (f % 30) * 2} r={12} fill={C.green} opacity={0.6} />}
				<text x={600} y={700} fill={open ? C.green : C.red} fontSize={lang === 'ta' ? 54 : 64} fontWeight={700} fontFamily={font(lang)}>
					{open ? (lang === 'ta' ? 'மலிவான பணம்' : 'cheap money') : lang === 'ta' ? 'கடன் விலை அதிகம்' : 'borrowing stays expensive'}
				</text>
				<text x={600} y={780} fill={C.dim} fontSize={lang === 'ta' ? 38 : 44} fontFamily={font(lang)}>
					{open ? (lang === 'ta' ? 'ரிஸ்க் பந்தயங்கள் கவர்ச்சி' : 'risky bets look attractive') : lang === 'ta' ? 'ஊக பணம் முதலில் வெளியேறும்' : 'speculative money leaves first'}
				</text>
			</svg>
		</AbsoluteFill>
	);
};

export const RiskLadder: React.FC<SceneProps> = ({lang, f}) => {
	const rungs = lang === 'ta' ? ['ரொக்கம்', 'அரசுப் பத்திரம்', 'பங்குகள்', 'டெக் பங்குகள்', 'கிரிப்டோ'] : ['cash', 'government bonds', 'stocks', 'tech stocks', 'crypto'];
	return (
		<AbsoluteFill>
			<Bg f={f} />
			<div style={{position: 'absolute', left: 560, right: 560, top: 150}}>
				{rungs.slice().reverse().map((r, i) => {
					const top = i === 0;
					const s = sp(f, i * 5, 12, 170);
					return (
						<div key={r} style={{height: 120, marginBottom: 18, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px',
							background: top ? `${C.red}33` : C.panel, border: `3px solid ${top ? C.red : C.line}`, transform: `translateX(${(1 - s) * 200}px) scale(${top ? 1 + 0.03 * Math.sin(f / 4) : 1})`, opacity: clamp(s * 1.4)}}>
							<Label lang={lang} size={50} color={top ? C.red : C.white}>{r}</Label>
							<div style={{fontFamily: font('en', 'mono'), fontSize: 34, color: top ? C.red : C.dim}}>{'▮'.repeat(5 - i)}</div>
						</div>
					);
				})}
			</div>
			<div style={{position: 'absolute', right: 200, top: 170, fontFamily: font(lang), fontSize: lang === 'ta' ? 34 : 40, color: C.red, fontWeight: 700, writingMode: 'vertical-rl'}}>
				{lang === 'ta' ? '↑ அதிக ஊகம்' : '↑ more speculative'}
			</div>
		</AbsoluteFill>
	);
};

// old vaults waking and moving coins
export const Whales: React.FC<SceneProps> = ({lang, f}) => (
	<AbsoluteFill>
		<Bg f={f} tint="#1d1606" />
		<svg width={1920} height={1080} style={{position: 'absolute'}}>
			{['2011', '2013', '2015', '2017'].map((y, i) => {
				const x = 300 + i * 300;
				const o = clamp((f - i * 8) / 14);
				return (
					<g key={y}>
						<rect x={x - 110} y={300} width={220} height={260} rx={16} fill="rgba(255,201,74,0.06)" stroke={C.gold} strokeWidth={5} />
						<rect x={x - 110 + o * 0} y={300} width={220 * (1 - o * 0.85)} height={260} rx={16} fill="#2a2212" stroke={C.gold} strokeWidth={4} />
						<text x={x} y={610} fill={C.gold} fontSize={40} textAnchor="middle" fontWeight={800} fontFamily={font('en', 'mono')}>{y}</text>
					</g>
				);
			})}
			{Array.from({length: 30}).map((_, i) => {
				const ph = (f * 0.022 + rnd(i)) % 1;
				const sx = 300 + (i % 4) * 300;
				const x = lerp(sx, 1620, eout(ph));
				const y = lerp(430, 470, ph) - Math.sin(ph * Math.PI) * (100 + rnd(i) * 80);
				return <g key={i} transform={`translate(${x},${y})`} opacity={Math.sin(ph * Math.PI)}><circle r={22} fill={C.orange} /><text y={8} fill="#1a0d00" fontSize={16} textAnchor="middle" fontWeight={800} fontFamily={font('en', 'mono')}>BTC</text></g>;
			})}
			<rect x={1500} y={330} width={240} height={220} rx={20} fill={C.panel} stroke={C.red} strokeWidth={5} />
			<text x={1620} y={455} fill={C.red} fontSize={lang === 'ta' ? 32 : 40} textAnchor="middle" fontWeight={700} fontFamily={font(lang)}>{lang === 'ta' ? 'விற்பனை' : 'SELL'}</text>
			<text x={960} y={800} fill={C.white} fontSize={lang === 'ta' ? 44 : 52} textAnchor="middle" fontWeight={700} fontFamily={font(lang)}>
				{lang === 'ta' ? 'பல ஆண்டுகளாக அசையாத காயின்கள் நகர்கின்றன' : 'coins untouched for years start moving'}
			</text>
		</svg>
	</AbsoluteFill>
);

// a match igniting a barrel labelled borrowed bets
export const Match: React.FC<SceneProps> = ({p, lang, f, full}) => {
	const lit = p.stage ? 1 : clamp((f - full * 0.4) / 10);
	const boom = p.stage ? eout(clamp(f / (full * 0.5))) : 0;
	return (
		<AbsoluteFill>
			<Bg f={f} tint={p.stage ? '#2a1606' : C.bg1} />
			<svg width={1920} height={1080} style={{position: 'absolute'}}>
				<g transform={`translate(${p.stage ? 1500 : lerp(1500, 1100, eout(clamp(f / (full * 0.4))))}, 360) rotate(-35)`}>
					<rect x={-10} y={0} width={20} height={300} fill="#d9b38c" />
					<ellipse cx={0} cy={-6} rx={20} ry={26} fill="#a33" />
					{lit > 0 ? <ellipse cx={0} cy={-50} rx={26 * lit} ry={50 * lit + Math.sin(f) * 6} fill={C.gold} opacity={0.9} style={{filter: `drop-shadow(0 0 20px ${C.orange})`}} /> : null}
				</g>
				<text x={1300} y={250} fill={C.gold} fontSize={lang === 'ta' ? 36 : 42} fontWeight={700} fontFamily={font(lang)}>{lang === 'ta' ? 'தீக்குச்சி: வரி மிரட்டல்' : 'the match: a tariff threat'}</text>
				<g transform="translate(700, 560)">
					<rect x={-200} y={-240} width={400} height={480} rx={40} fill="#3a1d0a" stroke={C.orange} strokeWidth={8} />
					{[-140, 0, 140].map((y) => <rect key={y} x={-200} y={y - 10} width={400} height={20} fill={C.orange} opacity={0.5} />)}
					<text y={10} fill={C.orange} fontSize={lang === 'ta' ? 38 : 46} textAnchor="middle" fontWeight={800} fontFamily={font(lang)}>{lang === 'ta' ? 'கடன் பந்தயங்கள்' : 'BORROWED BETS'}</text>
					<text y={70} fill={C.orange} fontSize={50} textAnchor="middle" fontWeight={800} fontFamily={font('en', 'mono')}>$200B+</text>
				</g>
				{boom > 0 ? Array.from({length: 24}).map((_, i) => {
					const a = (i / 24) * Math.PI * 2;
					const r = 120 + boom * (300 + rnd(i) * 300);
					return <circle key={i} cx={700 + Math.cos(a) * r} cy={560 + Math.sin(a) * r * 0.8} r={40 * (1 - boom) + 10} fill={i % 2 ? C.orange : C.red} opacity={1 - boom * 0.8} />;
				}) : null}
				{boom > 0 ? <circle cx={700} cy={560} r={400 * boom} fill={C.gold} opacity={0.25 * (1 - boom)} /> : null}
			</svg>
		</AbsoluteFill>
	);
};
