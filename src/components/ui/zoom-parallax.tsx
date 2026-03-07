'use client';

import { useScroll, useTransform, motion } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';

interface Image {
	src: string;
	alt?: string;
	href?: string;
}

interface ZoomParallaxProps {
	images: Image[];
	heading?: string;
	headingHighlight?: string;
}

export function ZoomParallax({ images, heading, headingHighlight }: ZoomParallaxProps) {
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

	const positionClasses = [
		'',
		'[&>div]:!-top-[30vh] [&>div]:!left-[5vw] [&>div]:!h-[30vh] [&>div]:!w-[35vw]',
		'[&>div]:!-top-[10vh] [&>div]:!-left-[25vw] [&>div]:!h-[45vh] [&>div]:!w-[20vw]',
		'[&>div]:!left-[27.5vw] [&>div]:!h-[25vh] [&>div]:!w-[25vw]',
		'[&>div]:!top-[27.5vh] [&>div]:!left-[5vw] [&>div]:!h-[25vh] [&>div]:!w-[20vw]',
		'[&>div]:!top-[27.5vh] [&>div]:!-left-[22.5vw] [&>div]:!h-[25vh] [&>div]:!w-[30vw]',
		'[&>div]:!top-[22.5vh] [&>div]:!left-[25vw] [&>div]:!h-[15vh] [&>div]:!w-[15vw]',
	];

	return (
		<div ref={container} className="relative h-[300vh]">
			<div className="sticky top-0 h-screen overflow-hidden">
				{/* Heading overlay */}
				{heading && (
					<div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
						<h2 className="text-display text-4xl sm:text-6xl lg:text-7xl tracking-wider text-center px-4 drop-shadow-lg">
							{heading} {headingHighlight && <span className="text-primary">{headingHighlight}</span>}
						</h2>
					</div>
				)}

				{images.map(({ src, alt, href }, index) => {
					const scale = scales[index % scales.length];

					const imageContent = (
						<div className="relative h-[25vh] w-[25vw]">
							<img
								src={src || '/placeholder.svg'}
								alt={alt || `Parallax image ${index + 1}`}
								className="h-full w-full rounded-lg object-cover transition-transform duration-300 hover:scale-105"
							/>
							{alt && (
								<div className="absolute inset-0 rounded-lg bg-gradient-to-t from-foreground/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
									<span className="text-xs font-semibold text-primary-foreground">{alt}</span>
								</div>
							)}
						</div>
					);

					return (
						<motion.div
							key={index}
							style={{ scale }}
							className={`absolute top-0 flex h-full w-full items-center justify-center ${positionClasses[index] || ''}`}
						>
							{href ? (
								<Link to={href} className="block">
									{imageContent}
								</Link>
							) : (
								imageContent
							)}
						</motion.div>
					);
				})}
			</div>
		</div>
	);
}
