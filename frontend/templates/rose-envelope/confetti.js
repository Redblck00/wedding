"use client";

import { useState } from "react";

import { useReducedMotion } from "./use-reduced-motion";

/**
 * A paper popper, fired once.
 *
 * Drawn as plain elements rather than on a canvas: sixty small divs animated by
 * `transform` and `opacity` are composited on the GPU without the main thread
 * touching them again, whereas a canvas would be a JavaScript frame loop on a
 * phone that has just finished submitting a form. No library either — the whole
 * effect is three keyframes in `globals.css` and the numbers below.
 *
 * The keyframes read each piece's trajectory from custom properties, so all
 * sixty share one set of rules.
 */

/** Palette of the invitation itself, plus the cream of the page, so the paper
 *  looks cut from this design and not thrown in from a party shop. */
const COLOURS = ["#E7A9BC", "#C99DA6", "#EBC89B", "#FFFDFC", "#B9939B", "#9F7480"];

/** Where the poppers stand, as a share of the width. Two at the edges pointing
 *  inwards and one in the middle — the shape a real pair of cannons makes. */
const MUZZLES = [0.06, 0.5, 0.94];

const PIECES = 54;

/**
 * One piece's flight.
 *
 * `Math.random` is safe here in a way it usually is not: this component only
 * ever mounts after a guest has submitted the form, so it never renders on the
 * server and there is no markup for a client render to disagree with. It is
 * called once and held in state, because regenerating on a re-render would
 * restart every animation mid-flight.
 */
function makePiece(index) {
  const muzzle = MUZZLES[index % MUZZLES.length];
  const random = (min, max) => min + Math.random() * (max - min);

  // Fired away from the wall it stands against; the middle one throws both ways.
  const outward = muzzle < 0.25 ? 1 : muzzle > 0.75 ? -1 : Math.random() < 0.5 ? -1 : 1;

  return {
    key: index,
    left: `${muzzle * 100}%`,
    colour: COLOURS[index % COLOURS.length],
    width: random(5, 10),
    height: random(9, 16),
    // A third of the paper is round, the rest strips. Real confetti is mixed,
    // and one shape repeated sixty times reads as a pattern.
    round: index % 3 === 0,
    dx: `${outward * random(8, 46)}vw`,
    rise: `${-random(45, 88)}vh`,
    fall: "112vh",
    // Tumbling on a random axis, so pieces turn edge-on at different moments
    // and the layer never looks like one sheet.
    axis: `${random(-1, 1).toFixed(2)}, ${random(-1, 1).toFixed(2)}, 1`,
    spin: `${random(360, 1140).toFixed(0)}deg`,
    duration: random(2.4, 4.1),
    delay: random(0, 0.5),
  };
}

export default function Confetti() {
  const reduced = useReducedMotion();

  // Built once. `useState`'s lazy initialiser rather than `useMemo`: this must
  // survive every re-render, and `useMemo` is a cache React is allowed to drop.
  const [pieces] = useState(() => Array.from({ length: PIECES }, (_, index) => makePiece(index)));

  // Nothing at all, not a still frame of it. The global reduced-motion rule
  // would otherwise collapse every animation to 0.01ms and drop sixty pieces of
  // paper on the screen in one flash, which is worse than the movement it was
  // meant to spare the guest.
  if (reduced) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.key}
          className="absolute bottom-0"
          style={{
            left: piece.left,
            "--confetti-dx": piece.dx,
            animation: `confetti-drift ${piece.duration}s linear ${piece.delay}s forwards`,
          }}
        >
          <div
            style={{
              "--confetti-rise": piece.rise,
              "--confetti-fall": piece.fall,
              animation: `confetti-arc ${piece.duration}s ${piece.delay}s forwards`,
            }}
          >
            <div
              style={{
                width: `${piece.width}px`,
                height: `${piece.round ? piece.width : piece.height}px`,
                background: piece.colour,
                borderRadius: piece.round ? "50%" : "1px",
                // A hair of shadow so cream pieces stay visible against the
                // near-white overlay behind them.
                boxShadow: "0 1px 2px rgba(105, 73, 81, 0.18)",
                "--confetti-axis": piece.axis,
                "--confetti-spin": piece.spin,
                animation: `confetti-spin ${piece.duration}s linear ${piece.delay}s forwards`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
