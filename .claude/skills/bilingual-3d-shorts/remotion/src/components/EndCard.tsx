import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {EndCard} from '../types';

// End card on every video: the channel's own logo + an animated "subscribe" ask.
// Kept in constant motion (drifting grid, breathing logo, pulsing button) so qa.py's freeze check stays clean.
export const EndCardView: React.FC<{card: EndCard; lang: 'en' | 'ta'; fontFamily: string}> = ({card, lang, fontFamily}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const fadeIn = interpolate(f, [0, 8], [0, 1], {extrapolateRight: 'clamp'});
	const logoIn = spring({frame: f - 2, fps, config: {damping: 11, stiffness: 160, mass: 0.8}});
	const textIn = spring({frame: f - 9, fps, config: {damping: 14, stiffness: 170}});
	const btnIn = spring({frame: f - 14, fps, config: {damping: 9, stiffness: 190, mass: 0.7}});
	const breathe = 1 + Math.sin(f / 7) * 0.025;
	const pulse = 1 + Math.max(0, Math.sin((f - 20) / 5)) * 0.06 * (f > 20 ? 1 : 0);
	const ring = ((f % 30) / 30);
	const ta = lang === 'ta';

	return (
		<AbsoluteFill style={{opacity: fadeIn}}>
			<AbsoluteFill style={{background: 'radial-gradient(circle at 50% 40%, #0f5560 0%, #06262d 48%, #020c0f 100%)'}} />
			<AbsoluteFill
				style={{
					backgroundImage:
						'linear-gradient(rgba(125,249,255,0.07) 2px, transparent 2px), linear-gradient(90deg, rgba(125,249,255,0.07) 2px, transparent 2px)',
					backgroundSize: '90px 90px',
					backgroundPosition: `0px ${f * 2}px`,
				}}
			/>
			<AbsoluteFill style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 54, paddingBottom: 120}}>
				<div style={{position: 'relative', width: 520, height: 520, transform: `scale(${interpolate(logoIn, [0, 1], [0.4, 1]) * breathe})`, opacity: Math.min(1, logoIn * 1.5)}}>
					<div
						style={{
							position: 'absolute',
							inset: -20,
							borderRadius: '50%',
							border: '6px solid rgba(125,249,255,0.55)',
							transform: `scale(${1 + ring * 0.18})`,
							opacity: 1 - ring,
						}}
					/>
					<Img
						src={staticFile(card.logo)}
						style={{width: 520, height: 520, borderRadius: '50%', boxShadow: '0 0 60px rgba(34,211,230,0.45), 0 20px 50px rgba(0,0,0,0.6)'}}
					/>
				</div>
				<div
					style={{
						fontFamily,
						fontWeight: 900,
						fontSize: ta ? 74 : 86,
						color: '#EAFBFD',
						textAlign: 'center',
						lineHeight: 1.1,
						textShadow: '0 0 30px rgba(125,249,255,0.45), 0 6px 18px rgba(0,0,0,0.7)',
						transform: `translateY(${interpolate(textIn, [0, 1], [40, 0])}px)`,
						opacity: textIn,
					}}
				>
					{card.channel}
				</div>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 22,
						padding: ta ? '28px 44px 22px' : '30px 64px',
						borderRadius: 999,
						background: 'linear-gradient(180deg, #FF5A3C, #E0241B)',
						boxShadow: `0 0 ${30 + (pulse - 1) * 500}px rgba(255,74,46,0.6), 0 14px 30px rgba(0,0,0,0.55)`,
						transform: `scale(${interpolate(btnIn, [0, 1], [0.3, 1]) * pulse})`,
						opacity: Math.min(1, btnIn * 1.4),
					}}
				>
					{/* bell */}
					<svg width={ta ? 52 : 64} height={ta ? 52 : 64} viewBox="0 0 24 24" fill="#fff" style={{transform: `rotate(${Math.sin(f / 2.5) * (f > 20 ? 14 : 0)}deg)`}}>
						<path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 0 0-5.5-6.84V3.5a1.5 1.5 0 0 0-3 0v.66A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2Z" />
					</svg>
					<div style={{fontFamily, fontWeight: 900, fontSize: ta ? 50 : 78, color: '#fff', letterSpacing: ta ? 0 : 3, lineHeight: 1}}>{card.cta}</div>
				</div>
				{card.subline ? (
					<div style={{fontFamily, fontWeight: 800, fontSize: ta ? 50 : 54, color: 'rgba(234,251,253,0.85)', textAlign: 'center', opacity: textIn, padding: '0 80px'}}>
						{card.subline}
					</div>
				) : null}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
