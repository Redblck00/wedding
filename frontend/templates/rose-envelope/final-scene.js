"use client";

import { useRef } from "react";

import { useScrollProgress } from "./use-scroll-progress";

/**
 * The closing panel: one photograph that opens out from the centre while the
 * couple's names fade up over it.
 *
 * Replaces the footer's photo hero rather than sitting next to it — two
 * full-bleed pictures back to back read as a mistake.
 *
 * `next/image` is deliberately not used here. The element is driven by a
 * `clip-path` that changes every frame, and `fill` would put a second
 * positioned wrapper between this one and the picture; a plain `img` keeps the
 * geometry the animation depends on. It is the last thing on the page, so
 * loading it lazily costs nothing.
 *
 * Scroll maths match the Figma FinalScene: window opens from 20% → 100%, text
 * arrives over the second half, picture eases out of its zoom.
 */
export default function FinalScene({ photoUrl, brideName, groomName, displayDate, subtitle }) {
  const ref = useRef(null);
  const progress = useScrollProgress(ref);

  if (!photoUrl) return null;

  const clipHeight = 20 + progress * 80;
  const textOpacity = Math.max(0, (progress - 0.5) * 2);
  const imageScale = 1.1 - progress * 0.08;

  const inset = (100 - clipHeight) / 2;
  // Wider than tall at the start so the opening reads as a landscape window;
  // goes negative near the end so the image fully clears the frame.
  const insetX = (100 - clipHeight * 1.78) / 2;

  return (
    <section ref={ref} className="relative h-[200vh]">
      <div className="sticky top-0 h-screen-safe overflow-hidden bg-[#795861]">
        <div
          className="absolute inset-0"
          style={{
            clipPath: `inset(${inset}% ${insetX}% ${inset}% ${insetX}%)`,
            transition: "clip-path 0.05s linear",
            willChange: "clip-path",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
            style={{
              transform: `scale(${imageScale})`,
              transition: "transform 0.05s linear",
              willChange: "transform",
            }}
          />

          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(105,73,81,0.1), rgba(105,73,81,0.6))",
            }}
          />
        </div>

        <div
          className="pointer-events-none absolute inset-0 z-[2] flex flex-col items-center justify-end px-6 pb-[min(8rem,18vh)] text-center"
          style={{ opacity: textOpacity, transition: "opacity 0.1s linear" }}
        >
          {subtitle ? (
            <p className="mb-5 font-invite-serif text-sm italic tracking-[0.35em] text-white/65">
              {subtitle}
            </p>
          ) : null}

          {/*
            A flex row that is a column on a phone, rather than three things run
            together in one text flow.

            Two long Mongolian names cannot share a line on a 390px screen, and
            the old markup gave them no choice: with no whitespace between a name
            and the ampersand there is no wrap opportunity, so the line did not
            break, it overflowed — and this panel clips, so the ends simply left
            the screen. As flex items each name is its own box, which stacks
            below `sm:` and wraps rather than overflows above it.

            The tracking is part of the same problem: 0.12em is another half
            character of width per character, and on a twelve-letter name that is
            most of the margin. Loosened back up from `sm:`, where the line has
            room to carry it.

            The ampersand is sized in `em` so it stays in proportion as the names
            resize around it — `text-3xl` stayed 30px while the names ran from
            36px to 88px.
          */}
          <h2 className="flex flex-col items-center gap-y-1 font-invite-display text-white text-[clamp(1.9rem,6.5vw,5.5rem)] leading-tight tracking-[0.06em] sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-3 sm:leading-none sm:tracking-[0.12em]">
            <span>{brideName}</span>
            <span className="font-invite-serif text-[0.5em]">&</span>
            <span>{groomName}</span>
          </h2>

          <div className="mt-6 flex items-center gap-3.5">
            <div className="h-px w-11 bg-white/30" />
            <p className="font-invite-serif text-sm tracking-[0.45em] text-white/60">{displayDate}</p>
            <div className="h-px w-11 bg-white/30" />
          </div>
        </div>
      </div>
    </section>
  );
}
