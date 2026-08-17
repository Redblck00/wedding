"use client";

import { useSyncExternalStore } from "react";

import IntroductionDecorations from "./introduction-decorations";
import Reveal from "./reveal";

const LABELS = [
  ["days", "Өдөр"],
  ["hours", "Цаг"],
  ["minutes", "Минут"],
  ["seconds", "Секунд"],
];

const ZERO = { days: 0, hours: 0, minutes: 0, seconds: 0 };
const SECOND = 1000;

function subscribe(onChange) {
  const timer = setInterval(onChange, SECOND);
  return () => clearInterval(timer);
}

/**
 * Whole seconds, not `Date.now()`.
 *
 * React compares snapshots with `Object.is` and re-renders until two agree, so a
 * getter that changes every millisecond loops forever. Truncating to the second
 * makes it stable for exactly as long as the display needs to be.
 */
function getSnapshot() {
  return Math.floor(Date.now() / SECOND);
}

/**
 * There is no clock to read while rendering on the server, and inventing one
 * would produce HTML that disagrees with the browser a moment later. Returning
 * null renders zeroes, which hydration immediately replaces.
 */
function getServerSnapshot() {
  return null;
}

function calculateTimeLeft(targetDate, now) {
  const difference = new Date(targetDate).getTime() - now;
  if (!Number.isFinite(difference) || difference <= 0) return ZERO;

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

/**
 * Ticks down to the ceremony.
 *
 * The clock is an external, always-changing source, which is exactly what
 * `useSyncExternalStore` is for — a `setInterval` writing state from an effect
 * would cascade a render every second and trip the rules-of-hooks lint.
 *
 * `targetDate` may be null — a couple can publish before fixing the day — in
 * which case the section renders nothing rather than a frozen row of zeroes.
 */
export default function Countdown({ targetDate }) {
  const nowSeconds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!targetDate) return null;

  const timeLeft = nowSeconds === null ? ZERO : calculateTimeLeft(targetDate, nowSeconds * SECOND);

  return (
    <section className="relative flex min-h-[75vh] items-center justify-center overflow-hidden bg-[#F9E7EC] px-6">
      <IntroductionDecorations />

      {/* `z-20`: the decorations sit at `z-10`, so text on the same layer would
          be held above them by markup order alone. */}
      <div className="relative z-20 text-center">
        <Reveal>
          <p className="font-invite-serif text-[10px] uppercase tracking-[0.5em] text-[#A77B83]">
            Хуримын өдөр хүртэл
          </p>
        </Reveal>

        <Reveal delay={150} className="mt-6">
          <h2 className="font-invite-display italic text-5xl text-[#694951] md:text-7xl">
            Until 
            <br />
            We say I do
          </h2>
        </Reveal>

        {/* The clock arrives last and as one block, not four. Four boxes rising
            one after another would read as a slot machine rather than a date. */}
        <Reveal delay={300} className="mt-14">
          <div className="grid grid-cols-4 gap-3 sm:gap-8">
            {LABELS.map(([key, label]) => (
              <TimeBox key={key} value={timeLeft[key]} label={label} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function TimeBox({ value, label }) {
  return (
    <div className="min-w-0">
      <div className="flex h-20 w-16 items-center justify-center border border-[#D8B7BE] bg-white/40 sm:h-28 sm:w-28">
        <span className="font-invite-display text-2xl text-[#694951] sm:text-4xl">
          {String(value).padStart(2, "0")}
        </span>
      </div>

      <p className="mt-3 font-invite-serif text-[8px] uppercase tracking-[0.3em] text-[#A77B83] sm:text-[10px]">
        {label}
      </p>
    </div>
  );
}
