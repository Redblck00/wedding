"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import { naturalRatio } from "@/lib/images";
import IntroductionDecorations from "./introduction-decorations";
import Reveal from "./reveal";

const CAPTIONS = [
  "THE LITTLE THINGS",
  "JUST US",
"Always",
  "Forever",
  "our story",
  "be loyalty",
];

/**
 * Soft doves, pink flowers and petals behind the horizontal gallery track.
 *
 * Purely ornamental — `pointer-events-none`, hidden from assistive tech — and
 * animated by the shared `decor-float` keyframes in `globals.css` rather than
 * by framer-motion, for the reason set out in `introduction-decorations.js`:
 * this is the one panel a guest drags sideways with a finger, and eleven
 * JavaScript animations recalculating on the same thread that has to answer
 * that finger is eleven too many.
 *
 * `hidden md:block` on most of them. The narrow screen shows a third of the
 * width these were placed across, so on a phone they were landing on top of
 * each other anyway; the doves and one flower carry the panel there.
 */
function GalleryDecorations() {
  return (
    <div aria-hidden className="decor-layer pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div
        className="decor-float absolute left-[6%] top-[18%] text-[#C99DA6]/45"
        style={{ "--decor-dx": "8px", "--decor-dy": "-14px", "--decor-duration": "9s" }}
      >
        <Dove className="h-14 w-14 rotate-[-12deg] md:h-20 md:w-20" />
      </div>

      <div
        className="decor-float absolute right-[8%] top-[22%] text-[#D3AAB3]/40"
        style={{
          "--decor-dx": "-10px",
          "--decor-dy": "12px",
          "--decor-duration": "11s",
          "--decor-delay": "1.2s",
        }}
      >
        <Dove className="h-12 w-12 scale-x-[-1] rotate-[8deg] md:h-16 md:w-16" />
      </div>

      <div
        className="decor-float absolute bottom-[16%] left-[12%] text-5xl text-[#C99DA6]/35 md:text-6xl"
        style={{ "--decor-dy": "-10px", "--decor-spin": "8deg", "--decor-duration": "7s" }}
      >
        ✿
      </div>

      <div
        className="decor-float absolute right-[14%] bottom-[20%] hidden text-4xl text-[#D9B8B8]/40 md:block md:text-5xl"
        style={{
          "--decor-dy": "10px",
          "--decor-spin": "-9deg",
          "--decor-duration": "8s",
          "--decor-delay": "0.6s",
        }}
      >
        ❀
      </div>

      <div
        className="decor-float absolute left-[28%] top-[12%] hidden text-3xl text-[#C89EA8]/40 md:block"
        style={{
          "--decor-from": 0.2,
          "--decor-to": 0.55,
          "--decor-from-scale": 0.9,
          "--decor-scale": 1.05,
          "--decor-duration": "5.5s",
        }}
      >
        ❁
      </div>

      <div
        className="decor-float absolute right-[30%] top-[14%] hidden text-2xl text-[#D3AAB3]/45 md:block"
        style={{
          "--decor-from": 0.15,
          "--decor-to": 0.5,
          "--decor-dy": "-8px",
          "--decor-duration": "6s",
          "--decor-delay": "0.8s",
        }}
      >
        ✾
      </div>

      <div
        className="decor-float absolute left-[40%] bottom-[12%] hidden h-3.5 w-6 rounded-full border border-[#C99DA6]/35 bg-[#F5DDE3]/45 md:block"
        style={{
          "--decor-dx": "6px",
          "--decor-dy": "-16px",
          "--decor-spin": "20deg",
          "--decor-duration": "6.5s",
        }}
      />

      <div
        className="decor-float absolute right-[38%] bottom-[14%] hidden h-3 w-5 rounded-full border border-[#C99DA6]/30 bg-[#F5DDE3]/40 md:block"
        style={{
          "--decor-dx": "-5px",
          "--decor-dy": "14px",
          "--decor-spin": "-18deg",
          "--decor-duration": "7.5s",
          "--decor-delay": "1s",
        }}
      />

      <div
        className="decor-float absolute left-[18%] top-[42%] text-lg text-[#D3AAB3]/50"
        style={{
          "--decor-from": 0.15,
          "--decor-to": 0.7,
          "--decor-from-scale": 0.7,
          "--decor-scale": 1.15,
          "--decor-duration": "3.2s",
        }}
      >
        ✦
      </div>

      <div
        className="decor-float absolute right-[20%] top-[48%] hidden text-sm text-[#D3AAB3]/45 md:block"
        style={{
          "--decor-from": 0.1,
          "--decor-to": 0.65,
          "--decor-from-scale": 0.8,
          "--decor-scale": 1.2,
          "--decor-duration": "2.8s",
          "--decor-delay": "0.5s",
        }}
      >
        ✦
      </div>

      {/* Soft pink washes so the track sits on atmosphere, not a flat panel.
          Static, so the blur is rasterised once and never again. */}
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

function cardHeightScale(ratio, index) {
  const shape =
    ratio > 1.2 ? CARD_SHAPE.landscape : ratio > 0.95 ? CARD_SHAPE.square : CARD_SHAPE.portrait;

  return shape * CARD_NUDGE[index % CARD_NUDGE.length];
}

/**
 * How strongly the depth effects read — blur, shrink and fade.
 *
 * `drift` and `zoom` are both zero now and kept only so the arithmetic below
 * reads the same on every screen. They were the parallax: the picture slid
 * inside its frame, and `zoom` was the 14% it had to be scaled up by first so
 * the slide never exposed an edge. That 14% is 7% off each side of every
 * photograph, permanently, and a parallax cannot be had any other way — it is
 * movement *within* a frame, so something has to be outside the frame to move
 * into. A gallery whose job is to show the couple's pictures as they took them
 * cannot pay that, so the effect goes.
 *
 * One table for the rest, because there are only two answers: this on a
 * notebook, and nothing at all on a phone.
 *
 * Each of the four costs something a phone cannot spare. `blur` re-rasterises
 * every card it is on, every frame. `zoom` is headroom for the parallax and is
 * paid for in photograph — at 1.08 a phone showed 92% of every picture, 4%
 * trimmed off each edge, which on a screen where one card is nearly the full
 * width is the difference between a family in frame and a child cut off at the
 * shoulder. And `shrink` and `fade` cost the most of all, though nothing about
 * them looks expensive: they change with the scroll, so keeping them means
 * React re-rendering all six cards on every frame of it.
 *
 * With them off, a phone's gallery is one `transform` written to one element
 * per frame and no re-render at all. The panel keeps its idea — photographs
 * travelling sideways as the page goes down — and loses the ornament on top of
 * it, which is the right way round when the alternative is a scroll that
 * stutters under the finger pushing it.
 *
 * `drift` is a *share of each card's width*, not a pixel count. A fixed 28px
 * shift is a sixth of a narrow portrait card and a twentieth of a wide one, and
 * on the narrow one it would slide the photograph clean past the zoom that is
 * meant to be hiding its edge.
 */
const DEPTH = { blur: 3.2, shrink: 0.07, fade: 0.55, drift: 0, zoom: 1 };

/** No effect at all — a phone, reduced motion, and the state before
 *  measurement. */
const DEPTH_OFF = { blur: 0, shrink: 0, fade: 0, drift: 0, zoom: 1 };

/**
 * Figma-style horizontal gallery: a strip of photographs the guest scrolls
 * sideways themselves.
 *
 * It used to be scroll-driven — a 340vh section holding a sticky panel, where
 * going *down* the page dragged the track *sideways*. That is a fine effect on
 * a notebook with a wheel, and it was the wrong one on the phone every guest
 * actually opens this on: the finger asked for one thing and the screen
 * answered with another, the panel held the viewport for three screens of
 * scrolling before the page would move on, and the invitation carried two
 * thousand pixels of height that showed nothing.
 *
 * Now the strip is what it looks like: an `overflow-x: auto` scroller. A finger
 * swiped sideways moves the photographs, a finger swiped up or down scrolls the
 * page, and nothing here touches a touch event to arrange that. Momentum,
 * rubber-banding and snapping are the browser's own, which is both better than
 * anything reimplemented here and free — on a phone this gallery now costs no
 * JavaScript per frame at all.
 *
 * `overscroll-x-contain` matters more than it looks. Without it a swipe that
 * runs off the end of the strip is a back-gesture in Chrome and in Safari, and
 * the guest leaves the invitation by reaching the last photograph.
 *
 * The mouse is the one pointer that still needs code, because a mouse has no
 * sideways gesture: the handlers below turn click-and-drag into `scrollLeft`,
 * and refuse every pointer that is not one.
 */
function HorizontalGallery({ photos }) {
  const scrollerRef = useRef(null);

  /*
   * Where each card sits along the strip and how wide the window onto it is.
   * The depth effects need both, and measuring a card inside the render would
   * force a layout on every scroll tick.
   */
  const [track, setTrack] = useState({ viewport: 0, cards: [] });
  const [screen, setScreen] = useState({ compact: false, reduced: false });

  // How far the strip has been scrolled, in pixels. Only maintained while the
  // depth effects are running — see the scroll listener below.
  const [scrolled, setScrolled] = useState(0);

  // Whether anything in the render still depends on that number. Read by the
  // listener, which runs between renders and so cannot see state.
  const depthOn = useRef(false);

  /*
   * The ratio of each photograph as the browser actually decoded it, by key.
   *
   * `media_assets` records a width and a height at upload, and the frame is
   * built from them — but they are a claim about the file, not a reading of it,
   * and a claim that is wrong puts a portrait picture in a landscape frame.
   * `naturalWidth` on the loaded image is not a claim, so it wins as soon as it
   * exists. Empty on the server and on the first paint, which is what keeps the
   * stored numbers useful: they are what the layout is built from until the
   * pictures themselves can correct it.
   */
  const [measured, setMeasured] = useState({});

  // The card under the cursor or the finger, which is shown unblurred whatever
  // the depth maths says. Pointer events rather than `:hover`, for two reasons:
  // the blur is an inline style and a stylesheet rule cannot outrank one, and
  // pointer events are the same events for a mouse and a touch, so this needs no
  // second path for phones.
  const [touched, setTouched] = useState(null);

  /*
   * Measure the strip, and re-measure whenever anything in it changes shape.
   *
   * The observer watches the cards, not only the scroller: the scroller is the
   * width of the screen and stays that width, while the cards resize twice
   * over — once when `measured` corrects a stored ratio, and again whenever
   * `50vh` moves under a collapsing address bar. Watching only the scroller
   * would leave the depth effects reading positions from before either.
   */
  useEffect(() => {
    const element = scrollerRef.current;
    if (!element) return;

    const measure = () => {
      setTrack({
        viewport: element.clientWidth,
        cards: Array.from(element.children, (card) => ({
          // `offsetLeft` is measured from the scroller's own padding edge, and
          // so is `scrollLeft` — so the two subtract cleanly in the render.
          centre: card.offsetLeft + card.offsetWidth / 2,
          width: card.offsetWidth,
        })),
      });
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    for (const child of element.children) observer.observe(child);

    return () => observer.disconnect();
  }, [photos]);

  /*
   * The scroll position, for the depth effects and for nothing else.
   *
   * Quantised to four pixels. The effects are a blur, a 7% scale and a fade,
   * all read from a position measured against the full width of the window, so
   * four pixels of travel is well under anything a guest could see — and it is
   * the difference between a render on every frame of a scroll and a render on
   * every fourth one.
   */
  useEffect(() => {
    const element = scrollerRef.current;
    if (!element) return;

    let frame = 0;

    const measure = () => {
      frame = 0;
      const stepped = Math.round(element.scrollLeft / 4) * 4;
      setScrolled((current) => (current === stepped ? current : stepped));
    };

    const schedule = () => {
      // On a phone the depth effects are off, so nothing in the render depends
      // on the scroll position and React never needs to hear about it. A swipe
      // there is the browser scrolling a box, and this listener returns.
      if (!depthOn.current || frame) return;
      frame = requestAnimationFrame(measure);
    };

    element.addEventListener("scroll", schedule, { passive: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      element.removeEventListener("scroll", schedule);
    };
  }, []);

  /*
   * Both media queries in an effect, and neither read during render.
   *
   * `framer-motion`'s `useReducedMotion` would be the obvious way to get the
   * second one, but it reads `matchMedia` straight into `useState`'s initial
   * value — so for a guest who has reduced motion on, the server renders one
   * gallery and the browser's first render another, and React tears the whole
   * thing down over a hydration mismatch. Read after mount and the first paint
   * always matches the HTML.
   *
   * `768px` is the same breakpoint Tailwind's `md:` uses. Watched rather than
   * sampled: a phone crosses it by being rotated.
   */
  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 768px)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      const next = { compact: narrow.matches, reduced: still.matches };
      // Read by the scroll listener, which cannot wait for a commit.
      depthOn.current = !next.compact && !next.reduced;
      setScreen(next);
    };

    sync();
    narrow.addEventListener("change", sync);
    still.addEventListener("change", sync);

    return () => {
      narrow.removeEventListener("change", sync);
      still.removeEventListener("change", sync);
    };
  }, []);

  /*
   * Click-and-drag, for a mouse and only for a mouse.
   *
   * `pointerType` is the whole guard. A touch already has a sideways gesture
   * and the browser's is better than this could be — it has momentum, snapping
   * and rubber-banding, none of which `scrollLeft` arithmetic reproduces. And
   * claiming touch here would claim the *vertical* swipe with it, leaving a
   * guest who wants to read on stuck on the photographs.
   */
  const drag = useRef(null);

  const startDrag = (event) => {
    const element = scrollerRef.current;
    if (!element || event.pointerType !== "mouse" || event.button !== 0) return;

    drag.current = { from: event.clientX, left: element.scrollLeft };
    element.setPointerCapture(event.pointerId);

    // Mandatory snapping and a drag cannot both be in charge: every write to
    // `scrollLeft` is a scroll operation of its own, and the browser answers
    // each one by snapping back to the nearest card, so the strip fights the
    // hand holding it. Off for the drag and handed back on release — which is
    // also what makes it settle onto a photograph when the button comes up.
    element.style.scrollSnapType = "none";

    // Stops the browser starting a text selection or dragging the photograph
    // out as an image, either of which ends a drag-scroll a few pixels in.
    event.preventDefault();
  };

  const moveDrag = (event) => {
    const element = scrollerRef.current;
    if (!element || !drag.current) return;

    element.scrollLeft = drag.current.left - (event.clientX - drag.current.from);
  };

  const endDrag = (event) => {
    const element = scrollerRef.current;
    if (!element || !drag.current) return;

    drag.current = null;
    element.style.scrollSnapType = "";
    if (element.hasPointerCapture(event.pointerId)) {
      element.releasePointerCapture(event.pointerId);
    }
  };

  const depth = screen.reduced || screen.compact ? DEPTH_OFF : DEPTH;

  /*
   * Whether there is a blur for a pointer to clear — and so whether the pointer
   * handlers on each card are worth having at all.
   *
   * They are not free on a phone. A finger dragging across the strip crosses
   * card after card, and every crossing fired `pointerenter`, which set state,
   * which re-rendered the gallery in the middle of the gesture it was reacting
   * to. With no blur to clear, all of that bought a `blur(0px)` replacing
   * nothing.
   */
  const clearable = depth.blur > 0;

  return (
    <section className="relative overflow-hidden bg-[#FFF0F5] pb-16 pt-14 md:pb-24 md:pt-20">
      {/*
        `GalleryDecorations` only — this panel already carries doves, petals
        and flowers of its own, placed around a strip of photographs rather
        than around a block of text. A second set on top of them would be
        twice the ornament in the one section that is meant to be looked
        through, not at.
      */}
      <GalleryDecorations />

      <div className="relative z-20 px-6 md:px-12">
        <p className="font-invite-serif text-xs tracking-[0.45em] text-[#A77B83]">Gallery</p>
        <p className="mt-1 font-invite-display italic text-[1.35rem] text-[#694951] md:text-[1.5rem]">
          Хуримын зураг
        </p>
      </div>

      {/*
        `tabIndex` and the label are not decoration: a scrollable region only a
        gesture can reach is unreachable from a keyboard, and with them the
        arrow keys move the strip like any other scroller.

        No `will-change: transform` any more, and nothing writes a transform to
        this element — the browser is scrolling a box now, which it already
        knows how to do without help.
      */}
      <div
        ref={scrollerRef}
        data-gallery-scroller
        role="region"
        aria-label="Хуримын зургууд"
        tabIndex={0}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="scrollbar-hide relative z-10 mt-8 flex snap-x snap-mandatory items-center gap-[clamp(1.25rem,3vw,2.5rem)] overflow-x-auto overscroll-x-contain focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CFAAB2] md:cursor-grab md:active:cursor-grabbing"
        style={{
          paddingLeft: "clamp(1.5rem, 10vw, 10rem)",
          paddingRight: "clamp(1.5rem, 6vw, 6rem)",
        }}
      >
        {photos.map((photo, index) => {
          const key = photo.id ?? index;
          const ratio = measured[key] ?? naturalRatio(photo);
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
              ? (card.centre - scrolled - track.viewport / 2) / track.viewport
              : 0;

          // Saturates at ±0.45 of the screen, so a card is fully "away" by the
          // time it reaches the edge rather than only once it has left.
          const away = Math.min(1, Math.abs(offset) / 0.45);

          // Pointing at a photograph is asking to see it, and answering that
          // with a blurred one is the wrong answer. The depth effect exists to
          // push the edges of the track back; it has no business standing
          // between a guest and the picture they just reached for.
          //
          // Only the blur clears. `shrink` and `fade` still track the card's
          // position, so the row keeps its depth and the hovered card does not
          // jump out of the arrangement.
          const focused = touched === index;
          const blur = focused ? 0 : away * depth.blur;

          return (
            <div key={key} className="flex shrink-0 snap-center flex-col gap-3">
              <div
                className="group relative overflow-hidden bg-[#F2DDE3]"
                onPointerEnter={clearable ? () => setTouched(index) : undefined}
                // Guarded rather than a bare `setTouched(null)`: moving from
                // one card to the next fires enter and leave in an order the
                // spec does not fix, and an unguarded leave would wipe the
                // entry the new card had just made.
                onPointerLeave={
                  clearable
                    ? () => setTouched((current) => (current === index ? null : current))
                    : undefined
                }
                // A touch that turns into a scroll is cancelled, not left —
                // without this the card a guest brushed on the way past would
                // stay clear for the rest of the session.
                onPointerCancel={
                  clearable
                    ? () => setTouched((current) => (current === index ? null : current))
                    : undefined
                }
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
                  // The ratio in both halves is the photograph's own, taken
                  // from the file once it has loaded. Nothing rounds it into
                  // a bucket and nothing clamps it, so a card is the shape of
                  // the picture in it — a tall one stands tall, a wide one
                  // lies wide, and a panorama is simply a long thin card.
                  //
                  // 94vw, not a safer 80: the cap only ever binds on a wide
                  // photo, and every percent taken off the width comes off the
                  // height twice as fast. At 86vw a landscape card stood 224px
                  // tall next to a 432px portrait, which is not rhythm, it is
                  // one of them looking like a mistake. At 94vw a wide photo
                  // takes the screen almost edge to edge — one picture at a
                  // time, which is the right unit on a phone anyway.
                  height: `min(calc(clamp(240px, 50vh, 460px) * ${cardHeightScale(ratio, index)}), calc(94vw / ${ratio}))`,
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
                    //
                    // The focused card is the one exception, and it has to be.
                    // A transition cannot run to or from `none`, so dropping
                    // the property is what makes the blur vanish in one frame
                    // instead of easing away — the layer costs one card's
                    // worth of compositing while a pointer is on it, which is
                    // the cheaper half of that trade.
                    filter:
                      blur > 0.05
                        ? `blur(${blur.toFixed(2)}px)`
                        : focused
                          ? "blur(0px)"
                          : undefined,
                    // Named, not `all`: the transform on this same element is
                    // rewritten every scroll frame to drive the parallax, and
                    // easing that would turn a live effect into a lagging one.
                    transition: "filter 0.25s ease-out",
                  }}
                >
                  <Image
                    src={photo.url}
                    alt=""
                    fill
                    preload={index === 0}
                    // A mouse drag across the strip would otherwise pick a
                    // photograph up and carry it, which ends the drag and
                    // leaves a ghost image trailing the cursor.
                    draggable={false}
                    // What the file says it is, once there is a file to ask.
                    // A frame built from a wrong stored width would otherwise
                    // stay wrong for the whole visit.
                    onLoad={(event) => {
                      const { naturalWidth, naturalHeight } = event.currentTarget;
                      if (!naturalWidth || !naturalHeight) return;

                      const actual = naturalWidth / naturalHeight;
                      setMeasured((current) =>
                        // Guarded: `onLoad` fires again for every new source
                        // Next serves as the screen resizes, and an unguarded
                        // write would be a render on each of them.
                        Math.abs((current[key] ?? 0) - actual) < 0.001
                          ? current
                          : { ...current, [key]: actual },
                      );
                    }}
                    // `md:` on the hover zoom, not because a phone cannot
                    // hover but because it never stops: a tap leaves `:hover`
                    // set on the card until something else is tapped, so on a
                    // phone this was a permanent 5% crop applied to whichever
                    // photograph a guest had touched last.
                    // `contain`, not `cover`. With the frame already the
                    // shape of the photograph the two draw the same pixels —
                    // but they fail differently, and that is the point: if a
                    // ratio is ever wrong again, `cover` answers by cutting
                    // the picture and `contain` answers by leaving a little
                    // of the card's own pink showing. One of those is a
                    // photograph with someone missing from it.
                    className="object-contain transition-transform duration-700 ease-out md:group-hover:scale-105"
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

      <p className="relative z-20 mt-9 text-center font-invite-serif text-[9px] uppercase tracking-[0.4em] text-[#B1848C]">
        Хажуу тийш гүйлгэнэ үү
      </p>
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
