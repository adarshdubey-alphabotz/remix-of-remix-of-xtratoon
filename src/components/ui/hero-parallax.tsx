"use client";

import React, { useEffect, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  animate,
  MotionValue,
} from "framer-motion";
import { Link } from "react-router-dom";

export const HeroParallax = ({
  products,
  header,
}: {
  products: {
    title: string;
    link: string;
    thumbnail: string;
  }[];
  header?: React.ReactNode;
}) => {
  const firstRow = products.slice(0, 5);
  const secondRow = products.slice(5, 10);
  const thirdRow = products.slice(10, 15);
  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const springConfig = { stiffness: 80, damping: 40, mass: 0.5 };

  // Track whether scroll-driven movement is done (scrollYProgress >= 0.5)
  const [autoScroll, setAutoScroll] = useState(false);

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (v) => {
      setAutoScroll(v >= 0.35);
    });
    return unsubscribe;
  }, [scrollYProgress]);

  // Scroll-driven translation (stops at ~500px)
  const scrollTranslateX = useSpring(
    useTransform(scrollYProgress, [0, 0.35], [0, 500]),
    springConfig
  );
  const scrollTranslateXReverse = useSpring(
    useTransform(scrollYProgress, [0, 0.35], [0, -500]),
    springConfig
  );

  // Auto-scroll motion values
  const autoX = useMotionValue(0);
  const autoXReverse = useMotionValue(0);

  useEffect(() => {
    if (!autoScroll) return;

    const baseOffset = 500;
    // Continuous auto-scroll animation
    const ctrl1 = animate(autoX, [baseOffset, baseOffset + 600, baseOffset], {
      duration: 20,
      repeat: Infinity,
      ease: "linear",
      repeatType: "loop",
    });
    const ctrl2 = animate(autoXReverse, [-baseOffset, -baseOffset - 600, -baseOffset], {
      duration: 20,
      repeat: Infinity,
      ease: "linear",
      repeatType: "loop",
    });

    return () => { ctrl1.stop(); ctrl2.stop(); };
  }, [autoScroll, autoX, autoXReverse]);

  // Use scroll-driven when not auto, auto when auto
  const translateX = autoScroll ? autoX : scrollTranslateX;
  const translateXReverse = autoScroll ? autoXReverse : scrollTranslateXReverse;

  const smoothSpring = { stiffness: 50, damping: 30, mass: 0.8 };

  const rotateX = useSpring(
    useTransform(scrollYProgress, [0, 0.25], [8, 0]),
    smoothSpring
  );
  const opacity = useSpring(
    useTransform(scrollYProgress, [0, 0.15], [0.3, 1]),
    smoothSpring
  );
  const rotateZ = useSpring(
    useTransform(scrollYProgress, [0, 0.25], [10, 0]),
    smoothSpring
  );
  const translateY = useSpring(
    useTransform(scrollYProgress, [0, 0.3], [-400, 200]),
    smoothSpring
  );

  return (
    <div
      ref={ref}
      className="h-[200vh] py-20 sm:py-40 overflow-hidden antialiased relative flex flex-col self-auto [perspective:1000px] [transform-style:preserve-3d] bg-background"
    >
      {header || <Header />}
      <motion.div
        style={{
          rotateX,
          rotateZ,
          translateY,
          opacity,
        }}
      >
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-10 sm:space-x-20 mb-10 sm:mb-20">
          {firstRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateX}
              key={product.title}
            />
          ))}
        </motion.div>
        <motion.div className="flex flex-row mb-10 sm:mb-20 space-x-10 sm:space-x-20">
          {secondRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateXReverse}
              key={product.title}
            />
          ))}
        </motion.div>
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-10 sm:space-x-20">
          {thirdRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateX}
              key={product.title}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export const Header = () => {
  return (
    <div className="max-w-7xl relative mx-auto py-20 md:py-40 px-4 w-full left-0 top-0">
      <h1 className="text-2xl md:text-7xl font-bold text-foreground">
        The Ultimate <br /> development studio
      </h1>
      <p className="max-w-2xl text-base md:text-xl mt-8 text-muted-foreground">
        We build beautiful products with the latest technologies and frameworks.
      </p>
    </div>
  );
};

export const ProductCard = ({
  product,
  translate,
}: {
  product: {
    title: string;
    link: string;
    thumbnail: string;
  };
  translate: MotionValue<number>;
}) => {
  return (
    <motion.div
      style={{
        x: translate,
      }}
      whileHover={{
        y: -20,
      }}
      key={product.title}
      className="group/product h-60 w-[20rem] sm:h-96 sm:w-[30rem] relative flex-shrink-0"
    >
      <Link
        to={product.link}
        className="block group-hover/product:shadow-2xl"
      >
        <img
          src={product.thumbnail}
          className="object-cover object-left-top absolute h-full w-full inset-0 rounded-lg"
          alt={product.title}
          loading="lazy"
          decoding="async"
        />
      </Link>
      <div className="absolute inset-0 h-full w-full opacity-0 group-hover/product:opacity-80 bg-foreground/80 pointer-events-none rounded-lg"></div>
      <h2 className="absolute bottom-4 left-4 opacity-0 group-hover/product:opacity-100 text-primary-foreground font-semibold">
        {product.title}
      </h2>
    </motion.div>
  );
};
