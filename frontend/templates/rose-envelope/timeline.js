"use client";

import { useRef } from "react";

import IntroductionDecorations from "./introduction-decorations";
import Reveal from "./reveal";
import { useScrollProgress } from "./use-scroll-progress";

/**
 * The paper keepsake tag — reads like a physical wedding-day letter.
 *
 * Desktop: floats beside the programme inside the sticky scene.
 * Phone: lives in its own section above the programme — out of the sticky panel,
 * so the sticky list still has room for six entries.
 */
function WeddingDayCard({ displayDate, className = "" }) {
  return (
    <div
      className={`relative mx-auto w-full max-w-[280px] border border-[#DABDC3] bg-[#FFFDFC] px-8 py-12 text-center shadow-[12px_25px_60px_rgba(105,73,81,0.12)] ${className}`}
    >
      <div className="absolute left-1/2 top-[18px] h-2.5 w-2.5 -translate-x-1/2 rounded-full border border-[#A77B83] bg-[#F9E7EC]" />
      <div className="absolute left-1/2 top-[23px] h-[42px] w-px bg-[#A77B83] opacity-35" />

      <div aria-hidden className="mb-6 mt-9 text-[28px] tracking-[8px] text-[#A77B83]">
        ❀
      </div>

      <p className="mb-[18px] font-invite-serif text-[0.65rem] tracking-[0.4em] text-[#A77B83]">
        WEDDING DAY
      </p>

      <h3 className="mb-5 font-invite-display text-[2.2rem] leading-[1.1] text-[#694951]">
        Бидний
        <br />
        онцгой өдөр
      </h3>

      <div className="mx-auto mb-5 h-px w-11 bg-[#CFAAB2]" />

      <p className="font-invite-serif text-[0.85rem] leading-[1.8] text-[#916C74]">
        Хайр, инээд,дурсамж
        <br />
         бидний хуримын баярт мөчүүдийг
        <br />
        хамт тэмдэглээрэй.
      </p>

      <p className="mt-7 font-invite-display text-[1.1rem] italic text-[#A77B83]">{displayDate}</p>

      <div aria-hidden className="absolute bottom-[18px] left-0 right-0 text-center text-lg text-[#A77B83]">
        ♡
      </div>
    </div>
  );
}

/**
 * The running order of the day, revealed entry by entry as the section scrolls.
 *
 * Reads the same `event_schedule` section the countdown takes its ceremony time
 * from, so the couple types the programme once.
 */
export default function Timeline({ entries, displayDate }) {
  const ref = useRef(null);
  const progress = useScrollProgress(ref);

  if (!entries?.length) return null;

  const cardY = -progress * 30;
  const cardRotation = progress * 3;
  // Spread reveals across the scroll so the last entry lands near the end,
  // regardless of how many programme items the couple added.
  const step = entries.length > 1 ? 0.85 / (entries.length - 1) : 0;

  return (
    <>
      {/*
        Phone only: the letter gets its own section, above the programme rather
        than inside the sticky panel — stacked in there it used to push half the
        schedule off a 100svh viewport.

        Sized to the letter, though, not to the viewport. `min-h-screen-safe`
        with `items-center` reserved a whole screen for a ~450px card, and the
        leftover — over 200px of it — all collected below the card, where it met
        the empty top half of the programme panel. Two pieces of centring, the
        same pink on both sides, reading as one long gap between the sections.
        The padding here is what should decide how far apart they sit.
      */}
      <section className="relative flex items-center justify-center overflow-hidden bg-[#F9E7EC] px-6 pb-10 pt-14 md:hidden">
        <IntroductionDecorations />

        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 top-1/4 h-56 w-56 rounded-full bg-[#F2DDE3]/70 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 bottom-1/4 h-48 w-48 rounded-full bg-[#FFF0F5]/80 blur-3xl"
        />

        <div className="relative z-20 w-full">
          <Reveal>
            <WeddingDayCard displayDate={displayDate} className="min-h-[390px]" />
          </Reveal>

          <Reveal delay={300} className="mt-6">
            <p className="text-center font-invite-serif text-[9px] uppercase tracking-[0.4em] text-[#B1848C]">
              Доош үзэх
            </p>
          </Reveal>
        </div>
      </section>

      <section ref={ref} className="relative h-[200vh]">
        <div className="sticky top-0 h-screen-safe overflow-hidden bg-[#F9E7EC]">
          <IntroductionDecorations />

          {/*
            Top-aligned on a phone, centred from `md:` up.

            The phone column holds the programme alone — the letter is the
            section above — so centring it only banked empty space against the
            top of the panel, right where the letter's own leftover space ended.
            Starting at the top closes that, and gives a six-entry schedule the
            full height to run into rather than half of it.

            Centring is still right on desktop, where this is a two-column scene
            and the letter has to line up beside the list.
          */}
          <div className="relative z-20 mx-auto grid h-full max-w-[1200px] grid-cols-1 items-start gap-[clamp(1.5rem,4vw,4rem)] px-[clamp(1.25rem,4vw,4rem)] py-[clamp(2rem,3vw,3rem)] md:grid-cols-2 md:items-center md:gap-[clamp(2rem,6vw,6rem)]">
            <div
              className="hidden items-center justify-center md:flex"
              style={{
                transform: `translateY(${cardY}px) rotate(${cardRotation}deg)`,
                transition: "transform 0.05s linear",
                willChange: "transform",
              }}
            >
              <WeddingDayCard displayDate={displayDate} className="min-h-[390px]" />
            </div>

            <div>
              {/* Only the heading. The entries below already arrive one by one,
                  driven by how far the section has been scrolled — putting a
                  second reveal on them would be two animations racing over the
                  same lines. */}
              <Reveal className="mb-2">
                <p className="font-invite-serif text-xs uppercase tracking-[0.45em] text-[#A77B83]">
                  Хөтөлбөр
                </p>
              </Reveal>

              <Reveal delay={150} className="mb-6 md:mb-8">
                <h2 className="font-invite-display text-[clamp(1.6rem,3.2vw,2.75rem)] leading-tight text-[#694951]">
                  Хуримын үйл ажиллагаа
                </h2>
              </Reveal>

              <div className="relative pl-[30px]">
                <div
                  className="absolute left-0 top-0 w-px"
                  style={{
                    height: `${Math.min(100, progress * 280)}%`,
                    background:
                      "linear-gradient(to bottom, transparent, #A77B83 15%, #A77B83 85%, transparent)",
                    transition: "height 0.1s linear",
                  }}
                />

                {entries.map((entry, index) => {
                  const visible = progress > index * step;

                  return (
                    <div
                      key={`${entry.title}-${index}`}
                      className={index < entries.length - 1 ? "relative pb-5 md:pb-7" : "relative"}
                      style={{
                        opacity: visible ? 1 : 0.2,
                        transform: `translateY(${visible ? 0 : 12}px)`,
                        transition: "opacity 0.6s ease, transform 0.6s ease",
                      }}
                    >
                      <div className="absolute -left-[34px] top-1 h-2 w-2 rounded-full bg-[#A77B83] shadow-[0_0_0_4px_rgba(167,123,131,0.12)]" />

                      {entry.startsAt ? (
                        <p className="mb-1 font-invite-serif text-md tracking-[0.3em] text-[#A77B83]">
                          {entry.startsAt}
                        </p>
                      ) : null}

                      <h3 className="mb-0.5 font-invite-display text-[2rem] text-[#694951] md:text-[1.15rem]">
                        {entry.title}
                      </h3>

                      {entry.description ? (
                        <p className="max-w-[420px] font-invite-serif text-sm leading-relaxed text-[#916C74]">
                          {entry.description}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
