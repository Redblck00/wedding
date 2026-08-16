"use client";

import { motion } from "framer-motion";

/**
 * The invitation's flower frame — two mirrored clusters that leave the middle
 * clear for whatever the section puts there.
 *
 * Used by every section, not only the opening one, so the same flowers recur
 * down the whole page. The positions are hand-placed rather than generated: a
 * random scatter kept dropping a flower behind the words on narrow screens.
 *
 * The clusters sit between 8% and 36% in from each edge, at 22–55% down. That
 * band is the middle of a section vertically while still being clear of its
 * centre horizontally, which is where headings and body copy live.
 */

const FLOWERS = [
  { symbol: "✿", className: "left-[8%] top-[30%] text-5xl rotate-[-18deg]", delay: 0 },
  { symbol: "❀", className: "left-[15%] top-[42%] text-3xl rotate-[12deg]", delay: 0.2 },
  { symbol: "✾", className: "left-[22%] top-[25%] text-4xl rotate-[-25deg]", delay: 0.4 },
  { symbol: "❁", className: "left-[27%] top-[55%] text-3xl rotate-[20deg]", delay: 0.6 },
  { symbol: "✿", className: "left-[33%] top-[35%] text-2xl rotate-[-10deg]", delay: 0.3 },
  { symbol: "❀", className: "right-[8%] top-[30%] text-5xl rotate-[18deg]", delay: 0.1 },
  { symbol: "✿", className: "right-[15%] top-[43%] text-3xl rotate-[-12deg]", delay: 0.4 },
  { symbol: "❁", className: "right-[22%] top-[25%] text-4xl rotate-[25deg]", delay: 0.6 },
  { symbol: "✾", className: "right-[27%] top-[55%] text-3xl rotate-[-20deg]", delay: 0.2 },
  { symbol: "❀", className: "right-[33%] top-[35%] text-2xl rotate-[10deg]", delay: 0.5 },
];

const PETALS = [
  "left-[18%] top-[32%] rotate-45",
  "left-[25%] top-[45%] rotate-12",
  "left-[30%] top-[22%] rotate-[-20deg]",
  "left-[12%] top-[55%] rotate-45",
  "right-[18%] top-[32%] rotate-[-45deg]",
  "right-[25%] top-[45%] rotate-[-12deg]",
  "right-[30%] top-[22%] rotate-[20deg]",
  "right-[12%] top-[55%] rotate-[-45deg]",
];

const SPARKLES = [
  { className: "left-[20%] top-[28%]", size: "text-lg" },
  { className: "left-[28%] top-[48%]", size: "text-sm" },
  { className: "left-[36%] top-[28%]", size: "text-xl" },
  { className: "right-[20%] top-[28%]", size: "text-lg" },
  { className: "right-[28%] top-[48%]", size: "text-sm" },
  { className: "right-[36%] top-[28%]", size: "text-xl" },
];

export default function IntroductionDecorations() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {FLOWERS.map((flower, index) => (
        <motion.div
          key={`flower-${index}`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: [0.25, 0.55, 0.3],
            scale: [0.85, 1, 0.9],
            y: [0, -8, 0],
            rotate: [-5, 5, -5],
          }}
          transition={{
            delay: flower.delay,
            // Staggered durations keep the cluster from pulsing in unison,
            // which reads as a blinking page rather than drifting petals.
            duration: 5 + index * 0.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`absolute ${flower.className} text-[#C99DA6]`}
        >
          {flower.symbol}
        </motion.div>
      ))}

      {PETALS.map((className, index) => (
        <motion.div
          key={`petal-${index}`}
          animate={{
            y: [0, -12, 0],
            x: [0, index % 2 === 0 ? 5 : -5, 0],
            rotate: [0, 15, 0],
          }}
          transition={{
            duration: 4 + index * 0.3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.15,
          }}
          className={`absolute h-3 w-5 rounded-full border border-[#C99DA6]/40 bg-[#F5DDE3]/50 ${className}`}
        />
      ))}

      {SPARKLES.map((sparkle, index) => (
        <motion.div
          key={`sparkle-${index}`}
          animate={{ opacity: [0.15, 0.8, 0.15], scale: [0.7, 1.2, 0.7] }}
          transition={{ duration: 2.5 + index * 0.3, repeat: Infinity, delay: index * 0.25 }}
          className={`absolute ${sparkle.className} ${sparkle.size} text-[#D3AAB3]`}
        >
          ✦
        </motion.div>
      ))}

      <motion.div
        animate={{ y: [0, -10, 0], opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute left-[17%] top-[38%] h-2 w-2 rounded-full bg-[#D9B8B8]"
      />

      <motion.div
        animate={{ y: [0, 8, 0], opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute right-[17%] top-[38%] h-2 w-2 rounded-full bg-[#D9B8B8]"
      />

      <div className="absolute left-[38%] top-[42%] h-1.5 w-1.5 rounded-full bg-[#C99DA6]/50" />
      <div className="absolute right-[38%] top-[42%] h-1.5 w-1.5 rounded-full bg-[#C99DA6]/50" />
    </div>
  );
}
