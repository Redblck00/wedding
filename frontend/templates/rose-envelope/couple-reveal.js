"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

import { frameRatio } from "@/lib/images";
import IntroductionDecorations from "./introduction-decorations";
import Reveal from "./reveal";
import { useScrollProgress } from "./use-scroll-progress";

const CAPTIONS = [
  "Дурсамж",
  "Хоёулаа",
  "Үргэлж",
  "Мөнхөд",
  "Гэрэл",
  "Хайр",
];

/**
 * Soft doves, pink flowers and petals behind the horizontal gallery track.
 * Purely ornamental — `pointer-events-none`, hidden from assistive tech.
 */
function GalleryDecorations() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <motion.div
        animate={{ y: [0, -14, 0], x: [0, 8, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[6%] top-[18%] text-[#C99DA6]/45"
      >
        <Dove className="h-14 w-14 rotate-[-12deg] md:h-20 md:w-20" />
      </motion.div>

      <motion.div
        animate={{ y: [0, 12, 0], x: [0, -10, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
        className="absolute right-[8%] top-[22%] text-[#D3AAB3]/40"
      >
        <Dove className="h-12 w-12 scale-x-[-1] rotate-[8deg] md:h-16 md:w-16" />
      </motion.div>

      <motion.div
        animate={{ y: [0, -10, 0], rotate: [-6, 6, -6] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[16%] left-[12%] text-5xl text-[#C99DA6]/35 md:text-6xl"
      >
        ✿
      </motion.div>

      <motion.div
        animate={{ y: [0, 10, 0], rotate: [8, -4, 8] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
        className="absolute right-[14%] bottom-[20%] text-4xl text-[#D9B8B8]/40 md:text-5xl"
      >
        ❀
      </motion.div>

      <motion.div
        animate={{ opacity: [0.2, 0.55, 0.2], scale: [0.9, 1.05, 0.9] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[28%] top-[12%] text-3xl text-[#C89EA8]/40"
      >
        ❁
      </motion.div>

      <motion.div
        animate={{ opacity: [0.15, 0.5, 0.15], y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
        className="absolute right-[30%] top-[14%] text-2xl text-[#D3AAB3]/45"
      >
        ✾
      </motion.div>

      <motion.div
        animate={{ y: [0, -16, 0], x: [0, 6, 0], rotate: [0, 20, 0] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[40%] bottom-[12%] h-3.5 w-6 rounded-full border border-[#C99DA6]/35 bg-[#F5DDE3]/45"
      />

      <motion.div
        animate={{ y: [0, 14, 0], x: [0, -5, 0], rotate: [0, -18, 0] }}
        transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute right-[38%] bottom-[14%] h-3 w-5 rounded-full border border-[#C99DA6]/30 bg-[#F5DDE3]/40"
      />

      <motion.div
        animate={{ opacity: [0.15, 0.7, 0.15], scale: [0.7, 1.15, 0.7] }}
        transition={{ duration: 3.2, repeat: Infinity }}
        className="absolute left-[18%] top-[42%] text-lg text-[#D3AAB3]/50"
      >
        ✦
      </motion.div>

      <motion.div
        animate={{ opacity: [0.1, 0.65, 0.1], scale: [0.8, 1.2, 0.8] }}
        transition={{ duration: 2.8, repeat: Infinity, delay: 0.5 }}
        className="absolute right-[20%] top-[48%] text-sm text-[#D3AAB3]/45"
      >
        ✦
      </motion.div>

      {/* Soft pink washes so the track sits on atmosphere, not a flat panel. */}
      <div className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-[#F2DDE3]/50 blur-3xl" />
      <div className="absolute -right-20 bottom-1/4 h-80 w-80 rounded-full bg-[#F9E7EC]/70 blur-3xl" />
    </div>
  );
}

function Dove({ className }) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden>
      <path d="M48.2 22.4c-1.6-3.4-4.8-5.6-8.6-5.8 1.2-2.4 1-5.3-.7-7.5-.4-.5-1.2-.4-1.5.2-1.4 2.6-1 5.7.8 7.9-3.6.8-6.6 3.4-7.8 6.9-2.8-1.6-6.2-1.8-9.2-.4-2.2 1-3.9 2.9-4.7 5.1-.2.6.3 1.2.9 1.1 3.1-.4 6 .8 7.8 3.1-2.4 1.2-4.3 3.4-5.1 6-.3.9.6 1.7 1.4 1.3 2.8-1.3 6.1-.8 8.3 1.3 1.4 1.3 3.4 1.8 5.3 1.3 1.5 3.6 4.7 6.2 8.6 6.8.7.1 1.2-.6.9-1.2-1.4-3.1-.6-6.7 2-9 2.4-2.1 5.8-2.7 8.8-1.5.7.3 1.4-.4 1.1-1.1-1.3-3.2-4.1-5.6-7.5-6.5 1.8-1.9 2.7-4.5 2.4-7.2-.1-.6-.6-1-1.2-.9z" />
      <circle cx="44.5" cy="20.5" r="1.2" fill="#FFF0F5" opacity="0.85" />
    </svg>
  );
}

/**
 * How tall one gallery card stands, as a multiple of the base height.
 *
 * The Figma gallery hands every card its own width *and* height — 340×480,
 * 560×380, 300×460, 580×400, 320×480, 420×540 — and the pattern hiding in those
 * numbers is that the two landscape cards are the short ones (380, 400) while
 * the portraits run 460 to 540. One fixed height, which is what this had, varies
 * only the width and leaves the top and bottom of the track as two straight
 * rules. The ragged edge *is* the rhythm; without it a row of photographs reads
 * as a filmstrip.
 *
 * A wide photo also gets unmanageable when it is tall: at the old height a 3:2
 * picture came out 658px wide on a 390px phone, so it could never be seen whole.
 * Shortening the landscape cards fixes the shape and that at the same time.
 */
const CARD_SHAPE = { landscape: 0.82, square: 0.94, portrait: 1.1 };

/**
 * A small per-card nudge so two portraits in a row are not twins — Figma's own
 * portraits are 480, 460, 480 and 540, never four of a kind.
 *
 * A lookup by index rather than `Math.random()`: a random height would be a
 * different number on the server and in the browser, and React would report the
 * hydration mismatch across every card in the gallery.
 */
const CARD_NUDGE = [1, 0.93, 1.06, 0.97, 1.04, 0.91];

function cardHeightScale(photo, index) {
  const ratio = frameRatio(photo);
  const shape =
    ratio > 1.2 ? CARD_SHAPE.landscape : ratio > 0.95 ? CARD_SHAPE.square : CARD_SHAPE.portrait;

  return shape * CARD_NUDGE[index % CARD_NUDGE.length];
}

/**
 * How strongly the depth effects read, per screen size.
 *
 * `blur` is the one that differs in kind rather than degree: a blur filter is
 * re-rasterised every frame for every card it is on, and on a phone that is the
 * one thing in this scene that can drop the scroll below 60fps. Depth on a
 * 390px screen is carried by scale and parallax alone, which are transforms the
 * compositor already handles.
 *
 * `drift` is a *share of each card's width*, not a pixel count. A fixed 28px
 * shift is a sixth of a narrow portrait card and a twentieth of a wide one, and
 * on the narrow one it would slide the photograph clean past the zoom that is
 * meant to be hiding its edge.
 */
const DEPTH = {
  wide: { blur: 3.2, shrink: 0.07, fade: 0.55, drift: 0.06, zoom: 1.14 },
  compact: { blur: 0, shrink: 0.05, fade: 0.45, drift: 0.03, zoom: 1.08 },
};

/** No effect at all — reduced motion, and the state before measurement. */
const DEPTH_OFF = { blur: 0, shrink: 0, fade: 0, drift: 0, zoom: 1 };

/**
 * Figma-style horizontal gallery: vertical scroll drives a sticky track sideways.
 *
 * Section height grows with photo count so each extra shot still has room to
 * travel across the viewport.
 */
function HorizontalGallery({ photos }) {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const progress = useScrollProgress(sectionRef);

  // Geometry, not just the travel distance: the depth effects need to know where
  // each card sits along the track, and measuring one card per frame in render
  // would force a layout on every scroll tick.
  const [track, setTrack] = useState({ maxX: 0, viewport: 0, cards: [] });
  const [screen, setScreen] = useState({ compact: false, reduced: false });

  useEffect(() => {
    const element = trackRef.current;
    if (!element) return;

    const measure = () => {
      setTrack({
        maxX: Math.max(0, element.scrollWidth - window.innerWidth),
        viewport: window.innerWidth,
        cards: Array.from(element.children, (card) => ({
          // `offsetLeft` is measured from the track's own padding edge, which is
          // the box the transform below moves — so subtracting the travel gives
          // the card's position on screen directly.
          centre: card.offsetLeft + card.offsetWidth / 2,
          width: card.offsetWidth,
        })),
      });
    };

    measure();
    window.addEventListener("resize", measure);

    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => {
      window.removeEventListener("resize", measure);
      observer.disconnect();
    };
  }, [photos]);

  /*
   * Both media queries in an effect, and neither read during render.
   *
   * `framer-motion`'s `useReducedMotion` would be the obvious way to get the
   * second one, but it reads `matchMedia` straight into `useState`'s initial
   * value — so for a guest who has reduced motion on, the server renders one
   * zoom and the browser's first render another, and React tears the whole
   * gallery down and rebuilds it over a hydration mismatch. Read after mount and
   * the first paint always matches the HTML.
   *
   * `768px` is the same breakpoint Tailwind's `md:` uses. Watched rather than
   * sampled: a phone crosses it by being rotated.
   */
  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 768px)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setScreen({ compact: narrow.matches, reduced: still.matches });

    sync();
    narrow.addEventListener("change", sync);
    still.addEventListener("change", sync);

    return () => {
      narrow.removeEventListener("change", sync);
      still.removeEventListener("change", sync);
    };
  }, []);

  const depth = screen.reduced ? DEPTH_OFF : screen.compact ? DEPTH.compact : DEPTH.wide;
  const travelled = progress * track.maxX;

  // Enough travel that the last card can reach the centre; floor keeps short
  // galleries from feeling over in one flick.
  const sectionHeight = `${Math.max(220, 100 + photos.length * 40)}vh`;

  return (
    <section ref={sectionRef} className="relative" style={{ height: sectionHeight }}>
      <div className="sticky top-0 h-screen-safe overflow-hidden bg-[#FFF0F5]">
        {/*
          `GalleryDecorations` only — this panel already carries doves, petals
          and flowers of its own, placed around a track of photographs rather
          than around a block of text. A second set on top of them would be
          twice the ornament in the one section that is meant to be looked
          through, not at.
        */}
        <GalleryDecorations />

        <div className="absolute left-6 top-8 z-20 md:left-12 md:top-10">
          <p className="font-invite-serif text-xs tracking-[0.45em] text-[#A77B83]">Gallery</p>
          <p className="mt-1 font-invite-display italic text-[1.35rem] text-[#694951] md:text-[1.5rem]">
            Бидний мөчүүд
          </p>
        </div>

        <div
          ref={trackRef}
          className="absolute top-0 left-0 z-10 flex h-full items-center gap-[clamp(1.25rem,3vw,2.5rem)] will-change-transform"
          style={{
            paddingLeft: "clamp(1.5rem, 10vw, 10rem)",
            paddingRight: "clamp(1.5rem, 6vw, 6rem)",
            transform: `translate3d(-${travelled}px, 0, 0)`,
          }}
        >
          {photos.map((photo, index) => {
            const ratio = frameRatio(photo);
            const label = String(index + 1).padStart(2, "0");
            const caption = CAPTIONS[index % CAPTIONS.length];

            const card = track.cards[index];
            // Where this card sits relative to the middle of the screen, as a
            // share of the screen's width: 0 dead centre, ±0.5 at either edge.
            // Zero until the measurement lands, which is also what the server
            // renders — so the first paint carries no effects and hydration has
            // nothing to disagree about.
            const offset =
              card && track.viewport
                ? (card.centre - travelled - track.viewport / 2) / track.viewport
                : 0;

            // Saturates at ±0.45 of the screen, so a card is fully "away" by the
            // time it reaches the edge rather than only once it has left.
            const away = Math.min(1, Math.abs(offset) / 0.45);
            const blur = away * depth.blur;

            return (
              <div key={photo.id ?? index} className="flex shrink-0 flex-col gap-3">
                <div
                  className="group relative overflow-hidden bg-[#F2DDE3]"
                  style={{
                    // Height is the driven axis and width comes from the ratio,
                    // so the picture is never cropped whatever shape it is —
                    // `aspect-ratio` sizes the axis that is left `auto`.
                    //
                    // The `min()` is the phone case: a 3:2 photograph at this
                    // height came out 519px wide on a 390px screen, so it could
                    // never be seen whole at any scroll position. Capping the
                    // *height* keeps the ratio honest — capping the width with
                    // `max-width` would leave the height behind and crop it.
                    //
                    // 94vw, not a safer 80: the cap only ever binds on a wide
                    // photo, and every percent taken off the width comes off the
                    // height twice as fast. At 86vw a landscape card stood 224px
                    // tall next to a 432px portrait, which is not rhythm, it is
                    // one of them looking like a mistake. At 94vw a wide photo
                    // takes the screen almost edge to edge — one picture at a
                    // time, which is the right unit on a phone anyway.
                    height: `min(calc(clamp(240px, 50vh, 460px) * ${cardHeightScale(photo, index)}), calc(94vw / ${ratio}))`,
                    aspectRatio: ratio,
                    transform: `scale(${1 - away * depth.shrink})`,
                    transition: "transform 0.25s ease-out",
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      // The photograph drifts against its own frame, which is
                      // what reads as depth. `zoom` is the headroom that makes
                      // it possible: without it the drift would expose the edge
                      // of the picture.
                      transform: `translate3d(${
                        Math.max(-1, Math.min(1, offset)) * (card?.width ?? 0) * depth.drift
                      }px, 0, 0) scale(${depth.zoom})`,
                      // Omitted entirely rather than set to `blur(0px)`: a
                      // filter property promotes the element to its own
                      // compositor layer even when it does nothing.
                      filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
                    }}
                  >
                    <Image
                      src={photo.url}
                      alt=""
                      fill
                      preload={index === 0}
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      // Cards run to 94vw on a phone and about 590px on a
                      // desktop. The old `70vw` under-asked for every landscape
                      // card, and Next served a file too small for the frame.
                      sizes="(max-width: 768px) 95vw, 620px"
                    />
                  </div>
                </div>

                <div
                  className="flex items-center gap-2.5"
                  style={{ opacity: 1 - away * depth.fade, transition: "opacity 0.25s ease-out" }}
                >
                  <span className="font-invite-serif text-xs tracking-[0.3em] text-[#A77B83]">
                    {label}
                  </span>
                  <div className="h-px w-5 bg-[#A77B83]/35" />
                  <span className="font-invite-serif text-xs tracking-[0.2em] text-[#916C74]">
                    {caption}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <p className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 font-invite-serif text-[9px] uppercase tracking-[0.4em] text-[#B1848C] md:bottom-10">
          Гүйлгэж үзнэ үү
        </p>
      </div>
    </section>
  );
}

/**
 * Story intro, optional pull-quote, then the Figma-style horizontal photo reel.
 */
export default function CoupleReveal({ photos, intro, quote }) {
  if (!photos?.length) return null;

  return (
    <div className="bg-[#FFF0F5]">
      <section className="relative overflow-hidden px-6 pb-20 pt-20 md:pb-28 md:pt-28">
        <IntroductionDecorations />

        {/* `z-20`, matching the hero: the decorations are `z-10`, and leaving
            the text on the same layer would leave it standing on markup order
            alone — one reordered line and a petal lands on the heading. */}
        <div className="relative z-20 mx-auto max-w-7xl">
          <div className="grid gap-10 md:grid-cols-2 md:items-end md:gap-12">
          
            {intro ? (
              <Reveal delay={300} className="md:ml-auto">
                <p className="max-w-sm font-invite-serif text-sm leading-7 text-[#916C74]">
                  {intro}
                </p>
              </Reveal>
            ) : null}
          </div>

          {quote ? (
            <Reveal className="mx-auto mt-20 max-w-md text-center md:mt-28">
              <p aria-hidden className="font-invite-display text-4xl text-[#76535B]">
                “
              </p>
              <p className="font-invite-serif text-lg italic leading-9 text-[#795861]">{quote}</p>
              <div className="mx-auto mt-8 h-px w-20 bg-[#CFAAB2]" />
            </Reveal>
          ) : null}
        </div>
      </section>

      <HorizontalGallery photos={photos} />
    </div>
  );
}
