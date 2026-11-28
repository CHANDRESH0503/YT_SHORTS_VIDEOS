import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Bg, C, Center, Coin, Label, Panel, Person, SceneProps, clamp, ease, eout, fmt, font, glow, lerp, rnd, sp, tr} from '../kit';

const col = (c?: string) => (c === 'red' ? C.red : c === 'green' ? C.green : c === 'cyan' ? C.cyan : c === 'gold' ? C.gold : C.orange);

// giant counting number. p: {v, pre, suf, dec, label, color, count}
export const Num: React.FC<SceneProps> = ({p, lang, f, full}) => {
	const c = col(p.color);
	const k = p.count ? eout(clamp(f / Math.min(full * 0.6, 45))) : 1;
	const v = p.v * k;
	const dec = p.dec ?? (Math.abs(p.v) < 10 && !Number.isInteger(p.v) ? 1 : 0);
	const s = sp(f, 0, 10, 160);
	const neg = v < 0;
	return (
		<AbsoluteFill>
			<Bg f={f} tint={p.color === 'red' ? '#2a0b16' : p.color === 'green' ? '#082a20' : C.bg1} />
			<Center style={{flexDirection: 'column', gap: 30, marginTop: -60}}>
				<div style={{fontFamily: font('en', 'mono'), fontWeight: 800, fontSize: 250, color: c, letterSpacing: '-0.04em',
					textShadow: glow(c, 30), transform: `scale(${0.7 + 0.3 * s})`}}>
					{neg ? '−' : ''}{p.pre ?? ''}{fmt(Math.abs(v), dec)}{p.suf ?? ''}
				</div>
				<Label lang={lang} size={58} color={C.white} style={{opacity: clamp(s * 1.3), letterSpacing: '0.01em'}}>{tr(p.label, lang)}</Label>
			</Center>
		</AbsoluteFill>
	);
};

// 2-3 horizontal bars. p: {items:[{l, v}], unit, pre, title}
export const Bars: React.FC<SceneProps> = ({p, lang, f, full}) => {
	const max = Math.max(...p.items.map((i: any) => i.v));
	return (
		<AbsoluteFill>
			<Bg f={f} />
			<div style={{position: 'absolute', left: 220, right: 220, top: 200}}>
				<Label lang={lang} size={50} color={C.dim} style={{marginBottom: 60}}>{tr(p.title, lang)}</Label>
				{p.items.map((it: any, i: number) => {
					const g = eout(clamp((f - 8 - i * 14) / 30));
					const last = i === p.items.length - 1;
					const c = last && p.items[0].v < it.v ? C.red : last ? C.red : C.cyan;
					return (
						<div key={i} style={{marginBottom: 56}}>
							<Label lang={lang} size={40} style={{marginBottom: 16}}>{tr(it.l, lang)}</Label>
							<div style={{display: 'flex', alignItems: 'center', gap: 30}}>
								<div style={{height: 90, width: `${Math.max(1.2, (it.v / max) * 78 * g)}%`, borderRadius: 14,
									background: `linear-gradient(90deg, ${c}88, ${c})`, boxShadow: glow(c, 16)}} />
								<div style={{fontFamily: font('en', 'mono'), fontSize: 64, fontWeight: 800, color: c}}>
									{p.pre}{fmt(it.v * g, it.v < 1 ? 3 : 1)}{p.unit}
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};

// market-value sphere inflating (or shrinking with p.to)
export const Mcap: React.FC<SceneProps> = ({p, lang, f, full}) => {
	const u = eout(clamp(f / (full * 0.7)));
	const v = p.to ? lerp(p.v, p.to, u) : p.v * u;
	const r = 120 + 230 * Math.sqrt(Math.max(0.02, v) / 4.4);
	const shrink = !!p.to;
	const c = shrink ? C.red : C.cyan;
	return (
		<AbsoluteFill>
			<Bg f={f} tint={shrink ? '#2a0b16' : C.bg1} />
			<Center style={{marginTop: -80}}>
				{shrink ? <div style={{position: 'absolute', width: 2 * (120 + 230 * Math.sqrt(p.v / 4.4)), height: 2 * (120 + 230 * Math.sqrt(p.v / 4.4)),
					borderRadius: '50%', border: `4px dashed ${C.dim}`}} /> : null}
				<div style={{width: r * 2, height: r * 2, borderRadius: '50%',
					background: `radial-gradient(circle at 35% 30%, ${c}cc, ${c}33 60%, ${c}11)`, boxShadow: glow(c, 50),
					display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
					<div style={{fontFamily: font('en', 'mono'), fontSize: 120, fontWeight: 800, color: '#fff', textShadow: glow(c, 20)}}>${v.toFixed(1)}T</div>
				</div>
			</Center>
			<div style={{position: 'absolute', bottom: 270, width: '100%', textAlign: 'center'}}>
				<Label lang={lang} size={52}>{tr(p.t, lang)}</Label>
			</div>
		</AbsoluteFill>
	);
};

// fuel tank filling to p.v billions
export const Tank: React.FC<SceneProps> = ({p, lang, f, full}) => {
	const u = eout(clamp(f / (full * 0.75)));
	const lvl = p.fuel ? 0.92 : 0.92 * u;
	const wave = Math.sin(f / 6) * 6;
	return (
		<AbsoluteFill>
			<Bg f={f} tint={p.fuel ? '#2a1606' : C.bg1} />
			<svg width={1920} height={1080} style={{position: 'absolute'}}>
				<defs>
					<clipPath id="tk"><rect x={760} y={180} width={400} height={600} rx={60} /></clipPath>
					<linearGradient id="fu" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={C.orange} /><stop offset="1" stopColor="#7a2a00" /></linearGradient>
				</defs>
				<g clipPath="url(#tk)">
					<rect x={760} y={180} width={400} height={600} fill="rgba(255,255,255,0.04)" />
					<path d={`M760,${780 - 600 * lvl + wave} Q960,${780 - 600 * lvl - 24 - wave} 1160,${780 - 600 * lvl + wave} L1160,780 L760,780 Z`} fill="url(#fu)" />
					{Array.from({length: 14}).map((_, i) => (
						<circle key={i} cx={780 + rnd(i) * 360} cy={780 - ((f * (1 + rnd(i + 2)) * 3 + rnd(i + 5) * 600) % (600 * lvl))} r={4 + rnd(i) * 6} fill="#ffd9a0" opacity={0.35} />
					))}
				</g>
				<rect x={760} y={180} width={400} height={600} rx={60} fill="none" stroke={C.orange} strokeWidth={6} style={{filter: `drop-shadow(0 0 16px ${C.orange})`}} />
				{[0.25, 0.5, 0.75].map((t) => <line key={t} x1={1160} x2={1200} y1={780 - 600 * t} y2={780 - 600 * t} stroke={C.dim} strokeWidth={3} />)}
				<text x={1240} y={420} fill={C.orange} fontSize={110} fontWeight={800} fontFamily={font('en', 'mono')} style={{filter: `drop-shadow(0 0 14px ${C.orange})`}}>
					${Math.round(p.v * (p.fuel ? 1 : u))}B+
				</text>
				<text x={1240} y={490} fill={C.white} fontSize={lang === 'ta' ? 40 : 48} fontWeight={700} fontFamily={font(lang)}>{tr(p.t, lang)}</text>
				{p.fuel ? (
					<g>
						{Array.from({length: 7}).map((_, i) => {
							const fl = 40 + Math.sin(f / 2 + i) * 18;
							return <ellipse key={i} cx={800 + i * 55} cy={175 - fl / 2} rx={22} ry={fl} fill={i % 2 ? C.gold : C.red} opacity={0.7} />;
						})}
					</g>
				) : null}
				<text x={760} y={140} fill={C.dim} fontSize={30} fontFamily={font(lang, 'mono')} letterSpacing={3}>{lang === 'ta' ? 'அக்டோபர் 2025 ஆரம்பம்' : 'EARLY OCTOBER 2025'}</text>
			</svg>
		</AbsoluteFill>
	);
};

// own $100 block + borrowed blocks; p.mult 1 | 10 | 100; p.burn = wiped out
export const Lever: React.FC<SceneProps> = ({p, lang, f, full}) => {
	const m = p.mult ?? 1;
	const n = m === 100 ? 60 : m === 10 ? 9 : 0;
	const cols = m === 100 ? 12 : 3;
	const size = m === 100 ? 50 : 120;
	const burn = p.burn ? clamp((f - full * 0.35) / (full * 0.4)) : 0;
	return (
		<AbsoluteFill>
			<Bg f={f} tint={p.burn ? '#2a0b16' : C.bg1} />
			<div style={{position: 'absolute', left: 260, top: 230, display: 'flex', alignItems: 'flex-end', gap: 120}}>
				<div style={{textAlign: 'center'}}>
					<div style={{width: 200, height: 200, borderRadius: 22, background: `linear-gradient(${C.green}, #0d7a52)`, boxShadow: glow(C.green, 20),
						display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font('en', 'mono'), fontWeight: 800, fontSize: 62, color: '#032',
						transform: `scale(${sp(f, 0)}) rotate(${burn * 8}deg)`, opacity: 1 - burn}}>$100</div>
					<Label lang={lang} size={40} style={{marginTop: 24}} color={C.green}>{lang === 'ta' ? 'உங்கள் பணம்' : 'your money'}</Label>
				</div>
				{n ? (
					<div style={{textAlign: 'center'}}>
						<div style={{display: 'grid', gridTemplateColumns: `repeat(${cols}, ${size}px)`, gap: 10}}>
							{Array.from({length: n}).map((_, i) => {
								const s = sp(f, 4 + i * (m === 100 ? 0.5 : 3), 12, 200);
								return <div key={i} style={{width: size, height: size, borderRadius: 12, background: `linear-gradient(${C.violet}, #4a2fb0)`,
									opacity: s * (1 - burn), transform: `translateY(${(1 - s) * -60 + burn * 200 * rnd(i)}px) rotate(${burn * 40 * (rnd(i + 1) - 0.5)}deg)`,
									boxShadow: `0 0 14px ${C.violet}66`}} />;
							})}
						</div>
						<Label lang={lang} size={40} style={{marginTop: 24}} color={C.violet}>{lang === 'ta' ? 'கடன் வாங்கியது' : 'borrowed'}</Label>
					</div>
				) : null}
			</div>
			<div style={{position: 'absolute', right: 90, top: 300, textAlign: 'right'}}>
				<div style={{fontFamily: font('en', 'mono'), fontSize: 150, fontWeight: 800, color: p.burn ? C.red : C.white, textShadow: glow(p.burn ? C.red : C.cyan, 20)}}>
					{p.burn ? '$0' : `${m}x`}
				</div>
				<Label lang={lang} size={48} color={C.dim}>
					{p.burn ? (lang === 'ta' ? 'கடன் பணம் = அதிக ஆபத்து' : 'borrowed money = wiped out') : lang === 'ta' ? `கட்டுப்பாடு: $${fmt(100 * m)}` : `controls $${fmt(100 * m)}`}
				</Label>
			</div>
		</AbsoluteFill>
	);
};

// house bought with a tiny deposit. p.move 0 | +10 | -10
export const House: React.FC<SceneProps> = ({p, lang, f, full}) => {
	const mv = p.move ?? 0;
	const u = eout(clamp((f - 6) / (full * 0.6)));
	const val = 100 + mv * u;
	const dep = mv === 0 ? 10 : mv > 0 ? 10 + 10 * u : Math.max(0, 10 - 10 * u);
	const c = mv > 0 ? C.green : mv < 0 ? C.red : C.cyan;
	const lift = mv * u * 6;
	return (
		<AbsoluteFill>
			<Bg f={f} tint={mv < 0 ? '#2a0b16' : mv > 0 ? '#082a20' : C.bg1} />
			<svg width={1920} height={1080} style={{position: 'absolute'}}>
				<g transform={`translate(560, ${520 - lift})`}>
					<polygon points="-260,0 0,-220 260,0" fill="none" stroke={c} strokeWidth={10} style={{filter: `drop-shadow(0 0 14px ${c})`}} />
					<rect x={-210} y={0} width={420} height={300} fill="rgba(255,255,255,0.03)" stroke={c} strokeWidth={10} />
					<rect x={-50} y={140} width={100} height={160} fill="none" stroke={c} strokeWidth={8} />
					<rect x={-160} y={60} width={80} height={70} fill={`${C.gold}55`} stroke={c} strokeWidth={6} />
					<rect x={80} y={60} width={80} height={70} fill={`${C.gold}55`} stroke={c} strokeWidth={6} />
				</g>
				<g transform="translate(1000, 260)">
					<text x={0} y={0} fill={C.dim} fontSize={36} fontFamily={font(lang)}>{lang === 'ta' ? 'வீட்டின் மதிப்பு' : 'house value'}</text>
					<text x={0} y={90} fill={C.white} fontSize={92} fontWeight={800} fontFamily={font('en', 'mono')}>${fmt(val * 1000)}</text>
					<text x={0} y={190} fill={C.dim} fontSize={36} fontFamily={font(lang)}>{lang === 'ta' ? 'உங்கள் அட்வான்ஸ்' : 'your deposit'}</text>
					<text x={0} y={280} fill={c} fontSize={92} fontWeight={800} fontFamily={font('en', 'mono')} style={{filter: `drop-shadow(0 0 12px ${c})`}}>${fmt(dep * 1000)}</text>
					{mv !== 0 ? (
						<text x={0} y={380} fill={c} fontSize={56} fontWeight={800} fontFamily={font(lang)} opacity={u}>
							{mv > 0 ? (lang === 'ta' ? '+10% → இரட்டிப்பு' : '+10% → doubled') : lang === 'ta' ? '−10% → முழுசா போச்சு' : '−10% → gone'}
						</text>
					) : (
						<text x={0} y={380} fill={C.cyan} fontSize={48} fontWeight={700} fontFamily={font(lang)}>{lang === 'ta' ? '10% அட்வான்ஸ், 90% கடன்' : '10% deposit, 90% loan'}</text>
					)}
				</g>
			</svg>
		</AbsoluteFill>
	);
};

// margin meter draining; stage 1 stamps LIQUIDATED
export const Liq: React.FC<SceneProps> = ({p, lang, f, full}) => {
	const u = clamp(f / (full * 0.8));
	const eq = p.stage ? Math.max(0, 0.22 - u * 0.4) : lerp(1, 0.35, ease(u));
	const stamp = p.stage ? sp(f, Math.round(full * 0.45), 9, 220) : 0;
	const c = eq < 0.25 ? C.red : eq < 0.5 ? C.gold : C.green;
	return (
		<AbsoluteFill>
			<Bg f={f} tint={p.stage ? '#2a0b16' : C.bg1} />
			<Center style={{marginTop: -60}}>
				<Panel style={{width: 1100, padding: 60}}>
					<Label lang={lang} size={38} color={C.dim}>{lang === 'ta' ? 'உங்கள் 10x பந்தயம்' : 'YOUR 10x BET'}</Label>
					<div style={{display: 'flex', justifyContent: 'space-between', marginTop: 30, fontFamily: font('en', 'mono'), fontSize: 44, color: C.white}}>
						<span>{lang === 'ta' ? 'டெபாசிட்' : 'deposit'}</span><span style={{color: c}}>${fmt(Math.round(eq * 100))}</span>
					</div>
					<div style={{height: 60, borderRadius: 30, background: 'rgba(255,255,255,0.06)', marginTop: 24, overflow: 'hidden', border: `2px solid ${C.line}`}}>
						<div style={{width: `${eq * 100}%`, height: '100%', background: `linear-gradient(90deg, ${c}88, ${c})`, boxShadow: glow(c, 12)}} />
					</div>
					<div style={{display: 'flex', justifyContent: 'space-between', marginTop: 30, fontFamily: font('en', 'mono'), fontSize: 36, color: C.dim}}>
						<span>{lang === 'ta' ? 'விலை' : 'price'}</span><span style={{color: C.red}}>−{((1 - eq) * 10).toFixed(1)}%</span>
					</div>
				</Panel>
				{stamp > 0 ? (
					<div style={{position: 'absolute', transform: `rotate(-12deg) scale(${2.2 - 1.2 * stamp})`, opacity: clamp(stamp * 2),
						border: `12px solid ${C.red}`, color: C.red, padding: '20px 50px', borderRadius: 20, fontFamily: font(lang), fontWeight: 700,
						fontSize: lang === 'ta' ? 96 : 130, letterSpacing: '0.06em', textShadow: glow(C.red, 16), background: 'rgba(20,0,6,0.6)'}}>
						{lang === 'ta' ? 'லிக்விடேட்!' : 'LIQUIDATED'}
					</div>
				) : null}
			</Center>
		</AbsoluteFill>
	);
};

// automatic market sell order firing
export const Sell: React.FC<SceneProps> = ({p, lang, f}) => (
	<AbsoluteFill>
		<Bg f={f} tint="#2a0b16" />
		<Center style={{flexDirection: 'column', gap: 40, marginTop: -60}}>
			<div style={{display: 'flex', gap: 30}}>
				{Array.from({length: 5}).map((_, i) => {
					const s = sp(f, i * 5, 10, 200);
					return (
						<div key={i} style={{width: 220, height: 110, borderRadius: 16, background: C.red, color: '#fff', fontFamily: font('en', 'mono'),
							fontWeight: 800, fontSize: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
							transform: `translateY(${(1 - s) * -200 + Math.sin((f - i * 5) / 4) * 8}px)`, opacity: clamp(s), boxShadow: glow(C.red, 14)}}>
							SELL ↓
						</div>
					);
				})}
			</div>
			<Label lang={lang} size={64}>{tr(p.t, lang)}</Label>
			<Label lang={lang} size={38} color={C.dim}>{lang === 'ta' ? 'எந்த விலையாக இருந்தாலும், உடனே' : 'any price · instantly'}</Label>
		</Center>
	</AbsoluteFill>
);

// deposit (collateral) panel: stage 0 = safe $1 token, 1 = marked down by a third, 2 = liquidated
export const Collateral: React.FC<SceneProps> = ({p, lang, f, full}) => {
	const st = p.stage ?? 0;
	const u = eout(clamp(f / (full * 0.6)));
	const val = st === 0 ? 10000 : st === 1 ? lerp(10000, 6500, u) : 6500;
	const lim = 7500;
	const c = val < lim ? C.red : C.green;
	const stamp = st === 2 ? sp(f, 10, 9, 220) : 0;
	return (
		<AbsoluteFill>
			<Bg f={f} tint={st ? '#2a0b16' : C.bg1} />
			<Center style={{marginTop: -60, gap: 80, flexDirection: 'row'}}>
				<div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 90px)', gap: 14}}>
					{Array.from({length: 20}).map((_, i) => (
						<Coin key={i} label={st ? '$.65' : '$1'} size={90} color={st ? C.red : C.green} dim={st && i >= 13 ? 0.15 : 1} />
					))}
				</div>
				<Panel style={{width: 680, padding: 50}}>
					<Label lang={lang} size={34} color={C.dim}>{lang === 'ta' ? 'பாதுகாப்பு டெபாசிட்' : 'SAFETY DEPOSIT'}</Label>
					<div style={{fontFamily: font('en', 'mono'), fontWeight: 800, fontSize: 96, color: c, textShadow: glow(c, 14), marginTop: 10}}>${fmt(Math.round(val))}</div>
					<div style={{position: 'relative', height: 40, background: 'rgba(255,255,255,0.06)', borderRadius: 20, marginTop: 30}}>
						<div style={{width: `${(val / 10000) * 100}%`, height: '100%', borderRadius: 20, background: c}} />
						<div style={{position: 'absolute', left: `${(lim / 10000) * 100}%`, top: -16, bottom: -16, width: 5, background: C.white}} />
					</div>
					<Label lang={lang} size={30} color={C.dim} style={{marginTop: 18}}>{lang === 'ta' ? 'வெள்ளைக் கோடு = லிமிட்' : 'white line = margin limit'}</Label>
				</Panel>
			</Center>
			{stamp > 0 ? (
				<Center>
					<div style={{transform: `rotate(-10deg) scale(${2 - stamp})`, opacity: clamp(stamp * 2), border: `12px solid ${C.red}`, color: C.red, padding: '18px 44px',
						borderRadius: 20, fontFamily: font(lang), fontWeight: 700, fontSize: lang === 'ta' ? 90 : 120, background: 'rgba(20,0,6,0.7)', textShadow: glow(C.red, 16)}}>
						{lang === 'ta' ? 'லிக்விடேட்!' : 'LIQUIDATED'}
					</div>
				</Center>
			) : null}
		</AbsoluteFill>
	);
};

// money particles into (dir in) or out of (dir out) a fund building
export const Flow: React.FC<SceneProps> = ({p, lang, f}) => {
	const out = p.dir === 'out';
	const c = out ? C.red : C.green;
	return (
		<AbsoluteFill>
			<Bg f={f} tint={out ? '#2a0b16' : '#082a20'} />
			<svg width={1920} height={1080} style={{position: 'absolute'}}>
				<g transform="translate(960, 300)">
					<polygon points="-300,0 0,-130 300,0" fill="none" stroke={C.white} strokeWidth={8} />
					{[-220, -110, 0, 110, 220].map((x) => <rect key={x} x={x - 22} y={20} width={44} height={330} fill="rgba(255,255,255,0.05)" stroke={C.white} strokeWidth={6} />)}
					<rect x={-320} y={350} width={640} height={36} fill="none" stroke={C.white} strokeWidth={8} />
					<text x={0} y={-30} fill={C.white} fontSize={lang === 'ta' ? 36 : 44} textAnchor="middle" fontWeight={700} fontFamily={font(lang)}>{tr(p.t, lang)}</text>
				</g>
				{Array.from({length: 40}).map((_, i) => {
					const ph = ((f * 0.025 + rnd(i)) % 1);
					const side = i % 2 ? 1 : -1;
					const t = out ? ph : 1 - ph;
					const x = 960 + side * lerp(80, 860, t) + (rnd(i + 3) - 0.5) * 80;
					const y = 520 + (rnd(i + 7) - 0.5) * 260 - Math.sin(t * Math.PI) * 60;
					return <text key={i} x={x} y={y} fill={c} fontSize={40 + rnd(i) * 20} fontWeight={800} fontFamily={font('en', 'mono')} opacity={Math.sin(ph * Math.PI)}>$</text>;
				})}
				<text x={960} y={830} fill={c} fontSize={64} textAnchor="middle" fontWeight={800} fontFamily={font(lang)} style={{filter: `drop-shadow(0 0 12px ${c})`}}>
					{out ? (lang === 'ta' ? '← பணம் வெளியே →' : '← money out →') : lang === 'ta' ? '→ பணம் உள்ளே ←' : '→ money in ←'}
				</text>
			</svg>
		</AbsoluteFill>
	);
};

// ETF/companies: towers borrowing cash to buy coins; p.falling = shares falling
export const Companies: React.FC<SceneProps> = ({p, lang, f, full}) => {
	const fall = p.falling ? eout(clamp(f / (full * 0.7))) : 0;
	return (
		<AbsoluteFill>
			<Bg f={f} tint={p.falling ? '#2a0b16' : C.bg1} />
			<svg width={1920} height={1080} style={{position: 'absolute'}}>
				{[0, 1, 2].map((i) => {
					const x = 460 + i * 500;
					const h = [420, 520, 360][i] * (1 - fall * [0.45, 0.6, 0.4][i]);
					return (
						<g key={i}>
							<rect x={x - 110} y={820 - h} width={220} height={h} fill="rgba(46,230,255,0.06)" stroke={p.falling ? C.red : C.cyan} strokeWidth={6} />
							{Array.from({length: Math.floor(h / 60)}).map((_, r) => [0, 1, 2].map((c) => (
								<rect key={`${r}-${c}`} x={x - 85 + c * 62} y={840 - h + r * 60} width={36} height={30} fill={rnd(r * 3 + c + i) > 0.4 ? `${C.gold}66` : 'transparent'} />
							)))}
							{!p.falling ? (
								<g>
									<text x={x - 160 - ((f * 3 + i * 40) % 120)} y={500 + i * 30} fill={C.violet} fontSize={34} fontWeight={800} fontFamily={font(lang)}>
										{lang === 'ta' ? 'கடன் $' : 'loan $'}
									</text>
									<g transform={`translate(${x + 60}, ${800 - h - 70 - ((f * 2 + i * 30) % 60)})`}>
										<circle r={34} fill={C.orange} opacity={0.9} />
										<text y={11} fill="#1a0d00" fontSize={28} fontWeight={800} textAnchor="middle" fontFamily={font('en', 'mono')}>BTC</text>
									</g>
								</g>
							) : (
								<text x={x} y={800 - h - 20} fill={C.red} fontSize={46} fontWeight={800} textAnchor="middle" fontFamily={font('en', 'mono')}>
									−{Math.round(fall * [38, 45, 33][i])}%
								</text>
							)}
						</g>
					);
				})}
				<line x1={200} x2={1720} y1={820} y2={820} stroke={C.line} strokeWidth={4} />
				<text x={960} y={140} fill={C.white} fontSize={lang === 'ta' ? 42 : 50} textAnchor="middle" fontWeight={700} fontFamily={font(lang)}>
					{p.falling ? (lang === 'ta' ? 'பிட்காயின் கம்பெனி ஷேர்கள் விழுகின்றன' : 'Bitcoin-buying companies: shares falling') : lang === 'ta' ? 'கடன் வாங்கி பிட்காயின் வாங்கும் கம்பெனிகள்' : 'Companies borrowing cash to buy Bitcoin'}
				</text>
			</svg>
		</AbsoluteFill>
	);
};

// 90% longs bar
export const LongShort: React.FC<SceneProps> = ({lang, f}) => {
	const g = eout(clamp((f - 6) / 30));
	return (
		<AbsoluteFill>
			<Bg f={f} />
			<div style={{position: 'absolute', left: 200, right: 200, top: 300}}>
				<Label lang={lang} size={48} color={C.dim}>{lang === 'ta' ? 'யார் லிக்விடேட் ஆனார்கள்?' : 'WHO GOT LIQUIDATED?'}</Label>
				<div style={{display: 'flex', height: 150, marginTop: 50, borderRadius: 20, overflow: 'hidden', border: `2px solid ${C.line}`}}>
					<div style={{width: `${90 * g}%`, background: `linear-gradient(90deg, ${C.red}aa, ${C.red})`, display: 'flex', alignItems: 'center', paddingLeft: 40,
						fontFamily: font(lang), fontWeight: 700, fontSize: lang === 'ta' ? 40 : 50, color: '#fff'}}>
						{g > 0.5 ? (lang === 'ta' ? 'விலை ஏறும் என்றவர்கள் 90%+' : 'betting UP  90%+') : ''}
					</div>
					<div style={{flex: 1, background: `${C.cyan}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font('en', 'mono'), fontSize: 38, color: C.cyan}}>
						{g > 0.8 ? '<10%' : ''}
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};

// one venue's liquidations
export const Venue: React.FC<SceneProps> = ({p, lang, f, full}) => {
	const g = eout(clamp(f / (full * 0.6)));
	return (
		<AbsoluteFill>
			<Bg f={f} />
			<svg width={1920} height={1080} style={{position: 'absolute'}}>
				<rect x={560} y={820 - 600 * g * (p.v / 19.2)} width={260} height={600 * g * (p.v / 19.2)} fill={C.red} rx={10} style={{filter: `drop-shadow(0 0 16px ${C.red})`}} />
				<rect x={1100} y={820 - 600 * g} width={260} height={600 * g} fill="none" stroke={C.dim} strokeDasharray="12 10" strokeWidth={4} rx={10} />
				<text x={690} y={790 - 600 * g * (p.v / 19.2)} fill={C.red} fontSize={80} textAnchor="middle" fontWeight={800} fontFamily={font('en', 'mono')}>${(p.v * g).toFixed(1)}B</text>
				<text x={1230} y={790 - 600 * g} fill={C.dim} fontSize={70} textAnchor="middle" fontWeight={800} fontFamily={font('en', 'mono')}>$19B</text>
				<text x={690} y={862} fill={C.white} fontSize={lang === 'ta' ? 32 : 38} textAnchor="middle" fontFamily={font(lang)}>{lang === 'ta' ? 'ஒரு டிசென்ட்ரலைஸ்டு எக்ஸ்சேஞ்ச்' : 'one decentralized exchange'}</text>
				<text x={1230} y={862} fill={C.dim} fontSize={lang === 'ta' ? 32 : 38} textAnchor="middle" fontFamily={font(lang)}>{lang === 'ta' ? 'மொத்த சந்தை' : 'whole market'}</text>
			</svg>
		</AbsoluteFill>
	);
};

// rate-cut odds gauge falling p.from -> p.to
export const Odds: React.FC<SceneProps> = ({p, lang, f, full}) => {
	const u = ease(clamp((f - 6) / (full * 0.7)));
	const v = lerp(p.from, p.to, u);
	const ang = lerp(-120, 120, v / 100);
	const c = v > 60 ? C.green : v > 50 ? C.gold : C.red;
	return (
		<AbsoluteFill>
			<Bg f={f} />
			<svg width={1920} height={1080} style={{position: 'absolute'}}>
				<g transform="translate(960, 560)">
					{Array.from({length: 41}).map((_, i) => {
						const a = ((-120 + i * 6) * Math.PI) / 180;
						const cc = i * 2.5 > 50 ? C.green : C.red;
						return <line key={i} x1={Math.sin(a) * 300} y1={-Math.cos(a) * 300} x2={Math.sin(a) * (i % 5 ? 330 : 350)} y2={-Math.cos(a) * (i % 5 ? 330 : 350)} stroke={cc} strokeWidth={i % 5 ? 4 : 8} opacity={0.7} />;
					})}
					<line x1={0} y1={0} x2={Math.sin((ang * Math.PI) / 180) * 270} y2={-Math.cos((ang * Math.PI) / 180) * 270} stroke={c} strokeWidth={14} strokeLinecap="round" style={{filter: `drop-shadow(0 0 14px ${c})`}} />
					<circle r={30} fill={c} />
					<text y={150} fill={c} fontSize={130} fontWeight={800} textAnchor="middle" fontFamily={font('en', 'mono')}>{Math.round(v)}%</text>
					<text x={-360} y={60} fill={C.dim} fontSize={36} textAnchor="middle" fontFamily={font('en', 'mono')}>0%</text>
					<text x={360} y={60} fill={C.dim} fontSize={36} textAnchor="middle" fontFamily={font('en', 'mono')}>100%</text>
				</g>
				<text x={960} y={140} fill={C.white} fontSize={lang === 'ta' ? 42 : 50} textAnchor="middle" fontWeight={700} fontFamily={font(lang)}>
					{lang === 'ta' ? 'டிசம்பர் வட்டி குறைப்புக்கான வாய்ப்பு' : 'Odds of a December rate cut'}
				</text>
			</svg>
		</AbsoluteFill>
	);
};

// a shop on a scale vs the cash in its till; p.locked = can't raise money
export const Shop: React.FC<SceneProps> = ({p, lang, f, full}) => {
	const u = ease(clamp((f - 6) / (full * 0.6)));
	const tilt = p.locked ? 9 : lerp(0, 9, u);
	return (
		<AbsoluteFill>
			<Bg f={f} />
			<svg width={1920} height={1080} style={{position: 'absolute'}}>
				<g transform="translate(960, 300)">
					<polygon points="-40,520 40,520 0,0" fill="rgba(255,255,255,0.08)" stroke={C.dim} strokeWidth={4} />
					<g transform={`rotate(${tilt})`}>
						<line x1={-560} x2={560} y1={0} y2={0} stroke={C.white} strokeWidth={10} />
						<g transform="translate(-480, 0)">
							<line x1={0} x2={0} y1={0} y2={120} stroke={C.dim} strokeWidth={3} />
							<g transform={`rotate(${-tilt}) translate(0,120)`}>
								<rect x={-150} y={0} width={300} height={170} fill="rgba(255,201,74,0.12)" stroke={C.gold} strokeWidth={6} />
								<polygon points="-170,0 170,0 130,-60 -130,-60" fill={C.red} opacity={0.8} />
								<text x={0} y={110} fill={C.gold} fontSize={lang === 'ta' ? 34 : 40} textAnchor="middle" fontWeight={700} fontFamily={font(lang)}>{lang === 'ta' ? 'கடையின் மதிப்பு' : 'the shop'}</text>
								{p.locked ? <text x={0} y={230} fill={C.red} fontSize={40} textAnchor="middle" fontWeight={800} fontFamily={font(lang)}>{lang === 'ta' ? 'பணம் திரட்ட முடியாது' : 'can\'t raise cash'}</text> : null}
							</g>
						</g>
						<g transform="translate(480, 0)">
							<line x1={0} x2={0} y1={0} y2={120} stroke={C.dim} strokeWidth={3} />
							<g transform={`rotate(${-tilt}) translate(0,120)`}>
								<rect x={-140} y={0} width={280} height={150} rx={14} fill="rgba(247,147,26,0.15)" stroke={C.orange} strokeWidth={6} />
								<text x={0} y={70} fill={C.orange} fontSize={44} textAnchor="middle" fontWeight={800} fontFamily={font('en', 'mono')}>BTC $$$</text>
								<text x={0} y={120} fill={C.orange} fontSize={lang === 'ta' ? 30 : 34} textAnchor="middle" fontWeight={700} fontFamily={font(lang)}>{lang === 'ta' ? 'கல்லாப்பெட்டி' : 'cash in the till'}</text>
							</g>
						</g>
					</g>
				</g>
				<text x={960} y={140} fill={C.white} fontSize={lang === 'ta' ? 42 : 50} textAnchor="middle" fontWeight={700} fontFamily={font(lang)}>
					{lang === 'ta' ? 'கம்பெனி மதிப்பு < அதன் பிட்காயின்' : 'Company value  <  its Bitcoin'}
				</text>
			</svg>
		</AbsoluteFill>
	);
};

// safety (insurance) fund draining
export const Fund: React.FC<SceneProps> = ({lang, f, full}) => {
	const u = eout(clamp(f / (full * 0.8)));
	const lvl = 0.85 * (1 - u);
	return (
		<AbsoluteFill>
			<Bg f={f} tint="#2a0b16" />
			<svg width={1920} height={1080} style={{position: 'absolute'}}>
				<path d="M700,220 L700,780 Q960,860 1220,780 L1220,220" fill="none" stroke={C.cyan} strokeWidth={8} />
				<clipPath id="fd"><path d="M704,220 L704,776 Q960,856 1216,776 L1216,220 Z" /></clipPath>
				<g clipPath="url(#fd)"><rect x={700} y={800 - 580 * lvl} width={520} height={600} fill={`${C.cyan}55`} /></g>
				<rect x={940} y={800} width={40} height={60 + u * 80} fill={C.cyan} opacity={0.6} />
				<text x={960} y={180} fill={C.white} fontSize={lang === 'ta' ? 42 : 50} textAnchor="middle" fontWeight={700} fontFamily={font(lang)}>{lang === 'ta' ? 'பாதுகாப்பு நிதி' : 'Safety fund'}</text>
				<text x={1300} y={520} fill={C.red} fontSize={60} fontWeight={800} fontFamily={font(lang)}>{lang === 'ta' ? 'போதவில்லை' : 'not enough'}</text>
			</svg>
		</AbsoluteFill>
	);
};

// auto-deleveraging: a winning short closed by force
export const Adl: React.FC<SceneProps> = ({p, lang, f, full}) => {
	const close = p.close ? sp(f, 6, 10, 200) : 0;
	const u = eout(clamp(f / (full * 0.5)));
	return (
		<AbsoluteFill>
			<Bg f={f} />
			<Center style={{gap: 60, marginTop: -60, flexDirection: 'row'}}>
				<Panel style={{width: 600, padding: 46, borderColor: C.red}}>
					<Label lang={lang} size={36} color={C.red}>{lang === 'ta' ? 'நஷ்டம் அடைந்தவர்' : 'LOSER'}</Label>
					<div style={{fontFamily: font('en', 'mono'), fontSize: 80, fontWeight: 800, color: C.red, marginTop: 10}}>−${fmt(Math.round(2.4 * u * 1000))}M</div>
					<Label lang={lang} size={30} color={C.dim} style={{marginTop: 12}}>{lang === 'ta' ? 'நஷ்டம் நிதியை மீறியது' : 'losses bigger than the fund'}</Label>
				</Panel>
				<div style={{fontSize: 90, color: C.gold, transform: `translateX(${Math.sin(f / 4) * 10}px)`}}>⇄</div>
				<Panel style={{width: 600, padding: 46, borderColor: C.green, position: 'relative'}}>
					<Label lang={lang} size={36} color={C.green}>{lang === 'ta' ? 'சரியாக கணித்தவர்' : 'WINNER (bet on the crash)'}</Label>
					<div style={{fontFamily: font('en', 'mono'), fontSize: 80, fontWeight: 800, color: C.green, marginTop: 10}}>+${fmt(Math.round(900 * u))}k</div>
					<Label lang={lang} size={30} color={C.dim} style={{marginTop: 12}}>{lang === 'ta' ? 'திறந்த நிலை' : 'position open'}</Label>
					{close > 0 ? (
						<div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `rgba(10,10,20,${0.75 * close})`, borderRadius: 26}}>
							<div style={{transform: `rotate(-8deg) scale(${2 - close})`, border: `10px solid ${C.gold}`, color: C.gold, padding: '10px 30px', borderRadius: 16,
								fontFamily: font(lang), fontWeight: 700, fontSize: lang === 'ta' ? 52 : 70}}>{lang === 'ta' ? 'கட்டாயமாக மூடப்பட்டது' : 'FORCE-CLOSED'}</div>
						</div>
					) : null}
				</Panel>
			</Center>
		</AbsoluteFill>
	);
};

// borrowed cash stack with an IOU tag
export const Cash: React.FC<SceneProps> = ({p, lang, f}) => (
	<AbsoluteFill>
		<Bg f={f} />
		<Center style={{flexDirection: 'column', gap: 50, marginTop: -60}}>
			<div style={{position: 'relative', width: 700, height: 360}}>
				{Array.from({length: 9}).map((_, i) => {
					const s = sp(f, i * 3, 12, 180);
					return <div key={i} style={{position: 'absolute', left: 120 + (i % 3) * 160, bottom: Math.floor(i / 3) * 70 + (1 - s) * 300, width: 220, height: 110,
						borderRadius: 10, background: `linear-gradient(135deg, #1f9e6a, ${C.green})`, border: '4px solid #0b5a3a', opacity: s, transform: `rotate(${(rnd(i) - 0.5) * 8}deg)`,
						display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font('en', 'mono'), fontWeight: 800, fontSize: 44, color: '#053'}}>$</div>;
				})}
				<div style={{position: 'absolute', right: -40, top: 0, transform: `rotate(12deg) scale(${sp(f, 18)})`, background: C.gold, color: '#3a2600', padding: '14px 28px',
					borderRadius: 12, fontFamily: font('en', 'mono'), fontWeight: 800, fontSize: 48, boxShadow: glow(C.gold, 12)}}>IOU</div>
			</div>
			<Label lang={lang} size={80} color={C.gold} style={{textShadow: glow(C.gold, 16)}}>{tr(p.t, lang)}</Label>
		</Center>
	</AbsoluteFill>
);

// end-of-year scoreboard
export const Scoreboard: React.FC<SceneProps> = ({p, lang, f}) => {
	const rows = p.part === 2
		? [{n: lang === 'ta' ? 'தங்கம்' : 'Gold', v: lang === 'ta' ? 'சாதனை உச்சம் அருகே' : 'near record highs', c: C.gold, up: true},
			{n: lang === 'ta' ? 'ஸ்டாக் மார்க்கெட்' : 'US stocks', v: lang === 'ta' ? 'சாதனை உச்சம் அருகே' : 'near record highs', c: C.green, up: true},
			{n: 'Bitcoin', v: '−6%', c: C.red, up: false}]
		: [{n: 'Bitcoin', v: '−6%', c: C.red}, {n: lang === 'ta' ? 'ஈதர்' : 'Ether', v: '−11%', c: C.red}, {n: lang === 'ta' ? 'சொலானா' : 'Solana', v: lang === 'ta' ? '−33%-க்கு மேல்' : 'over −33%', c: C.red}];
	return (
		<AbsoluteFill>
			<Bg f={f} />
			<div style={{position: 'absolute', left: 330, right: 330, top: 170}}>
				<Label lang={lang} size={44} color={C.dim} style={{marginBottom: 40, letterSpacing: '0.08em'}}>{lang === 'ta' ? '2025 · வருட முடிவு' : '2025 · FULL YEAR'}</Label>
				{rows.map((r, i) => {
					const s = sp(f, 6 + i * 10, 12, 170);
					return (
						<div key={i} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '30px 40px', marginBottom: 22, borderRadius: 20,
							background: C.panel, border: `2px solid ${r.c}66`, transform: `translateX(${(1 - s) * 300}px)`, opacity: clamp(s * 1.5)}}>
							<Label lang={lang} size={56}>{r.n}</Label>
							<div style={{fontFamily: font(lang, 'mono'), fontWeight: 800, fontSize: lang === 'ta' && r.v.length > 6 ? 40 : 64, color: r.c, textShadow: glow(r.c, 10)}}>{r.v}</div>
						</div>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};
