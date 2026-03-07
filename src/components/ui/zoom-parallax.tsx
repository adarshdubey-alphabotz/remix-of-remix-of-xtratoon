'use client';

import { useScroll, useTransform, motion } from 'framer-motion';
import { useRef } from 'react';

interface Image {
	src: string;
	alt?: string;
}

interface ZoomParallaxProps {
	images: Image[];
	caption?: string;
	captionHighlight?: string;
}

export function ZoomParallax({ images, caption, captionHighlight }: ZoomParallaxProps) {
	const container = useRef(null);
	const { scrollYProgress } = useScroll({
		target: container,
		offset: ['start start', 'end end'],
	});

	const scale4 = useTransform(scrollYProgress, [0, 1], [1, 4]);
	const scale5 = useTransform(scrollYProgress, [0, 1], [1, 5]);
	const scale6 = useTransform(scrollYProgress, [0, 1], [1, 6]);
	const scale8 = useTransform(scrollYProgress, [0, 1], [1, 8]);
	const scale9 = useTransform(scrollYProgress, [0, 1], [1, 9]);

	const scales = [scale4, scale5, scale6, scale5, scale6, scale8, scale9];

	// Caption fades in during last 30% of scroll
	const captionOpacity = useTransform(scrollYProgress, [0.7, 0.95], [0, 1]);
	const captionY = useTransform(scrollYProgress, [0.7, 0.95], [40, 0]);
	const captionScale = useTransform(scrollYProgress, [0.7, 0.95], [0.9, 1]);

	return (
		<div ref={container} className="relative h-[300vh]">
			<div className="sticky top-0 h-screen overflow-hidden bg-background">
				{images.map(({ src, alt }, index) => {
					const scale = scales[index % scales.length];

					return (
						<motion.div
							key={index}
							style={{ scale }}
							className={`absolute top-0 flex h-full w-full items-center justify-center ${index === 1 ? '[&>div]:!-top-[30vh] [&>div]:!left-[5vw] [&>div]:!h-[30vh] [&>div]:!w-[35vw]' : ''} ${index === 2 ? '[&>div]:!-top-[10vh] [&>div]:!-left-[25vw] [&>div]:!h-[45vh] [&>div]:!w-[20vw]' : ''} ${index === 3 ? '[&>div]:!left-[27.5vw] [&>div]:!h-[25vh] [&>div]:!w-[25vw]' : ''} ${index === 4 ? '[&>div]:!top-[27.5vh] [&>div]:!left-[5vw] [&>div]:!h-[25vh] [&>div]:!w-[20vw]' : ''} ${index === 5 ? '[&>div]:!top-[27.5vh] [&>div]:!-left-[22.5vw] [&>div]:!h-[25vh] [&>div]:!w-[30vw]' : ''} ${index === 6 ? '[&>div]:!top-[22.5vh] [&>div]:!left-[25vw] [&>div]:!h-[15vh] [&>div]:!w-[15vw]' : ''} `}
						>
							<div className="relative h-[25vh] w-[25vw]">
								<img
									src={src || '/placeholder.svg'}
									alt={alt || `Parallax image ${index + 1}`}
									className="h-full w-full rounded-lg object-cover"
								/>
							</div>
						</motion.div>
					);
				})}

				{/* Caption that appears as images zoom out of view */}
				{caption && (
					<motion.div
						className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
						style={{ opacity: captionOpacity }}
					>
						<motion.div
							className="text-center px-4"
							style={{ y: captionY, scale: captionScale }}
						>
							<h2 className="font-display text-4xl sm:text-6xl lg:text-8xl tracking-wider text-foreground leading-[0.9]">
								{caption.split(captionHighlight || '').map((part, i, arr) => (
									<span key={i}>
										{part}
										{i < arr.length - 1 && (
											<span className="text-primary">{captionHighlight}</span>
										)}
									</span>
								))}
							</h2>
						</motion.div>
					</motion.div>
				)}
			</div>
		</div>
	);
}
