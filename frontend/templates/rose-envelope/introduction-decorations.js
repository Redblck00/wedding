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
 *
 * Every piece drifts on a CSS animation — `decor-float` in `globals.css` — and
 * not on framer-motion. Nine sections render this component, so what was
 * twenty-six JavaScript animations here was two hundred and thirty on the page,
 * every one of them recomputed on the main thread each frame whether its
 * section was on screen or not. That is the thread a phone also draws scrolling
 * with, and it showed. Nothing about the movement changed; only who runs it.
 *
 * No `"use client"` either, now that there are no hooks and no motion
 * components left: `GoogleMap` is a server component, and this can render as
 * plain HTML inside it instead of dragging a client boundary along.
 *
 * `phone: true` marks the pieces that survive on a narrow screen. A 390px
 * viewport shows a third of the width a 1200px one does but the same
 * twenty-six pieces were placed on it, and half of them landed on top of each
 * other; keeping twelve is both lighter and, on that screen, tidier.
 */

const FLOWERS = [
  { symbol: "✿", place: "left-[8%] top-[30%] text-5xl rotate-[-18deg]", delay: 0, phone: true },
  { symbol: "❀", place: "left-[15%] top-[42%] text-3xl rotate-[12deg]", delay: 0.2 },
  { symbol: "✾", place: "left-[22%] top-[25%] text-4xl rotate-[-25deg]", delay: 0.4, phone: true },
  { symbol: "❁", place: "left-[27%] top-[55%] text-3xl rotate-[20deg]", delay: 0.6 },
  { symbol: "✿", place: "left-[33%] top-[35%] text-2xl rotate-[-10deg]", delay: 0.3 },
  { symbol: "❀", place: "right-[8%] top-[30%] text-5xl rotate-[18deg]", delay: 0.1, phone: true },
  { symbol: "✿", place: "right-[15%] top-[43%] text-3xl rotate-[-12deg]", delay: 0.4 },
  { symbol: "❁", place: "right-[22%] top-[25%] text-4xl rotate-[25deg]", delay: 0.6, phone: true },
  { symbol: "✾", place: "right-[27%] top-[55%] text-3xl rotate-[-20deg]", delay: 0.2 },
  { symbol: "❀", place: "right-[33%] top-[35%] text-2xl rotate-[10deg]", delay: 0.5 },
];

const PETALS = [
  { place: "left-[18%] top-[32%] rotate-45", phone: true },
  { place: "left-[25%] top-[45%] rotate-12" },
  { place: "left-[30%] top-[22%] rotate-[-20deg]" },
  { place: "left-[12%] top-[55%] rotate-45", phone: true },
  { place: "right-[18%] top-[32%] rotate-[-45deg]", phone: true },
  { place: "right-[25%] top-[45%] rotate-[-12deg]" },
  { place: "right-[30%] top-[22%] rotate-[20deg]" },
  { place: "right-[12%] top-[55%] rotate-[-45deg]", phone: true },
];

const SPARKLES = [
  { place: "left-[20%] top-[28%]", size: "text-lg", phone: true },
  { place: "left-[28%] top-[48%]", size: "text-sm" },
  { place: "left-[36%] top-[28%]", size: "text-xl" },
  { place: "right-[20%] top-[28%]", size: "text-lg", phone: true },
  { place: "right-[28%] top-[48%]", size: "text-sm" },
  { place: "right-[36%] top-[28%]", size: "text-xl" },
];

/** `hidden md:block` for anything a phone does not keep. A `display: none`
 *  element runs no animation at all, which is the point of the flag. */
const onPhone = (piece) => (piece.phone ? "" : "hidden md:block");

export default function IntroductionDecorations() {
  return (
    <div aria-hidden className="decor-layer pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {FLOWERS.map((flower, index) => (
        <div
          key={`flower-${index}`}
          className={`decor-float absolute ${flower.place} text-[#C99DA6] ${onPhone(flower)}`}
          style={{
            "--decor-dy": "-8px",
            "--decor-spin": "8deg",
            "--decor-from-scale": 0.88,
            "--decor-from": 0.28,
            "--decor-to": 0.55,
            // Staggered durations keep the cluster from pulsing in unison,
            // which reads as a blinking page rather than drifting petals.
            "--decor-duration": `${5 + index * 0.2}s`,
            "--decor-delay": `${flower.delay}s`,
          }}
        >
          {flower.symbol}
        </div>
      ))}

      {PETALS.map((petal, index) => (
        <div
          key={`petal-${index}`}
          className={`decor-float absolute h-3 w-5 rounded-full border border-[#C99DA6]/40 bg-[#F5DDE3]/50 ${petal.place} ${onPhone(petal)}`}
          style={{
            "--decor-dy": "-12px",
            "--decor-dx": index % 2 === 0 ? "5px" : "-5px",
            "--decor-spin": "15deg",
            "--decor-duration": `${4 + index * 0.3}s`,
            "--decor-delay": `${index * 0.15}s`,
          }}
        />
      ))}

      {SPARKLES.map((sparkle, index) => (
        <div
          key={`sparkle-${index}`}
          className={`decor-float absolute ${sparkle.place} ${sparkle.size} text-[#D3AAB3] ${onPhone(sparkle)}`}
          style={{
            "--decor-from": 0.15,
            "--decor-to": 0.8,
            "--decor-from-scale": 0.7,
            "--decor-scale": 1.2,
            "--decor-duration": `${2.5 + index * 0.3}s`,
            "--decor-delay": `${index * 0.25}s`,
          }}
        >
          ✦
        </div>
      ))}

      <div
        className="decor-float absolute left-[17%] top-[38%] h-2 w-2 rounded-full bg-[#D9B8B8]"
        style={{ "--decor-dy": "-10px", "--decor-from": 0.2, "--decor-to": 0.6, "--decor-duration": "4s" }}
      />

      <div
        className="decor-float absolute right-[17%] top-[38%] h-2 w-2 rounded-full bg-[#D9B8B8]"
        style={{ "--decor-dy": "8px", "--decor-from": 0.2, "--decor-to": 0.6, "--decor-duration": "3s" }}
      />

      <div className="absolute left-[38%] top-[42%] h-1.5 w-1.5 rounded-full bg-[#C99DA6]/50" />
      <div className="absolute right-[38%] top-[42%] h-1.5 w-1.5 rounded-full bg-[#C99DA6]/50" />
    </div>
  );
}
