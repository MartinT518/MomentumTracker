import React, { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

interface PageTransitionProps {
  children: ReactNode;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 1.02,
  },
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.4,
};

const pageStyle = {
  position: "absolute" as const,
  width: "100%",
  minHeight: "100vh",
};

export function PageTransition({ children }: PageTransitionProps) {
  const [location] = useLocation();

  return (
    <div className="relative overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
          style={pageStyle}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Alternative slide transition for specific pages
const slideVariants = {
  initial: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0,
  }),
  in: {
    x: 0,
    opacity: 1,
  },
  out: (direction: number) => ({
    x: direction < 0 ? 1000 : -1000,
    opacity: 0,
  }),
};

const slideTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.5,
};

interface SlideTransitionProps {
  children: ReactNode;
  direction?: number;
}

export function SlideTransition({ children, direction = 1 }: SlideTransitionProps) {
  const [location] = useLocation();

  return (
    <div className="relative overflow-hidden">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={location}
          custom={direction}
          initial="initial"
          animate="in"
          exit="out"
          variants={slideVariants}
          transition={slideTransition}
          style={pageStyle}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Fade transition for simpler pages
const fadeVariants = {
  initial: {
    opacity: 0,
  },
  in: {
    opacity: 1,
  },
  out: {
    opacity: 0,
  },
};

const fadeTransition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.3,
};

export function FadeTransition({ children }: PageTransitionProps) {
  const [location] = useLocation();

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={location}
          initial="initial"
          animate="in"
          exit="out"
          variants={fadeVariants}
          transition={fadeTransition}
          style={pageStyle}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}