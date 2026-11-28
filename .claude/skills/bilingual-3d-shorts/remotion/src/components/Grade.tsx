import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import type {Timeline} from '../types';

// Colour grade preset (config.grade_presets: teal / warm-sunlit / night / neutral) + vignette + animated grain.
// Sits above visuals, below text. One preset per video, chosen in timeline.py.
export const Grade: React.FC<{grade: Timeline['grade']}> = ({grade}) => {
	const f = useCurrentFrame();
	const gx = Math.floor(random(`gx${f}`) * 200);
	const gy = Math.floor(random(`gy${f}`) * 200);
	return (
		<>
			{grade.tint_opacity > 0 ? (
				<AbsoluteFill style={{backgroundColor: grade.tint, opacity: grade.tint_opacity, mixBlendMode: 'soft-light'}} />
			) : null}
			<AbsoluteFill
				style={{background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 52%, rgba(0,0,0,${grade.vignette}) 100%)`}}
			/>
			<AbsoluteFill
				style={{
					opacity: grade.grain ?? 0.05,
					mixBlendMode: 'overlay',
					backgroundImage:
						"url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
					backgroundPosition: `${gx}px ${gy}px`,
				}}
			/>
		</>
	);
};
