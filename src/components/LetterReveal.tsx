"use client";

import { motion } from "framer-motion";

interface LetterRevealProps {
  text: string;
  className?: string;
  delay?: number;
  staggerDelay?: number;
  reducedMotion?: boolean;
}

export default function LetterReveal({
  text,
  className = "",
  delay = 0,
  staggerDelay = 0.04,
  reducedMotion = false,
}: LetterRevealProps) {
  if (reducedMotion) {
    return <div className={className}>{text}</div>;
  }

  return (
    <div className={className} aria-label={text}>
      {text.split("").map((char, i) => (
        <motion.span
          key={`${char}-${i}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: delay + i * staggerDelay,
            ease: "easeOut",
          }}
          className="inline-block"
          aria-hidden="true"
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </div>
  );
}
