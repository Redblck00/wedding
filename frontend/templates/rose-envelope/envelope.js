"use client";

import Image from "next/image";
import { motion } from "framer-motion";

import IntroductionDecorations from "./introduction-decorations";

/**
 * The closed envelope a guest taps to open the invitation.
 *
 * This is the whole first screen, so it carries the couple's names — a guest
 * forwarded the link in a group chat should know whose wedding it is before
 * tapping anything.
 */
export default function Envelope({ brideName, groomName, initials, onOpen }) {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <IntroductionDecorations />

      <div className="relative z-20 flex w-full max-w-2xl flex-col items-center text-center">
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="font-invite-display text-[clamp(1.5rem,7vw,3.75rem)] leading-tight text-[#6D4B53]"
        >
          Хуримын урилга
        </motion.p>

        {/*
          Small on a phone, and stacked there too.

          `text-4xl` was 36px of display serif, and two Mongolian names on one
          line at that size need about 600px — a phone column is 342. With no
          whitespace between the names and the ampersand there is no wrap
          opportunity either, so it did not wrap, it overflowed and the section
          clipped it. `clamp()` answers to the viewport and the names take a
          line each until `sm:`, which is how the opened hero sets them too.

          The ampersand is sized in `em` so it stays in proportion as the names
          resize around it.
        */}
        {/* <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="font-invite-display text-[clamp(1.5rem,7vw,3.75rem)] leading-tight text-[#6D4B53]"
        >
          <span className="block sm:inline">{brideName}</span>
          <span className="block font-invite-serif text-[0.5em] sm:mx-3 sm:inline">&</span>
          <span className="block sm:inline">{groomName}</span>
        </motion.h1> */}

        {/* <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 1 }}
          className="mt-5 font-invite-serif text-sm tracking-[0.3em] text-[#A77B83]"
        >
          Хуримын урилга
        </motion.p> */}

        <motion.button
          type="button"
          onClick={onOpen}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ scale: 1.025 }}
          whileTap={{ scale: 0.97 }}
          aria-label="Урилгыг нээх"
          className="group relative mt-10 w-[240px] sm:mt-14 sm:w-[320px]"
        >
          <div className="absolute inset-0 -z-10 rounded-3xl bg-white/40 blur-3xl" />

          {/*
            Card and seal together: the card clips its own contents so the
            artwork cannot spill past the rule, and the seal has to hang over
            that edge to read as a seal.
          */}
          <div className="relative">
            {/*
              The drawn envelope — flap, folds and centred wax seal — is gone in
              favour of the couple's artwork.

              Those pieces were opaque triangles stacked over the card, and
              together they covered everything but two slivers at the top
              corners and one at the bottom: whatever went underneath was very
              nearly invisible. The artwork is the design now, so it gets the
              whole card, and the envelope reads through the frame instead — a
              rose paper ground, a hairline rule inset from the border the way
              formal stationery is printed, and the seal below.
            */}
            <div className="relative aspect-[4/5] overflow-hidden rounded-sm border border-[#DABDC3] bg-gradient-to-br from-[#FBECEF] to-[#F2DDE3] shadow-[0_30px_80px_rgba(110,70,80,0.15)]">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-[10px] z-10 border border-[#E0BEC6]/70"
              />

              {/*
                `object-contain`, not `cover`: the source is a square PNG of two
                standing figures on a transparent ground, and cropping it to a
                4:5 card would take the hem of the dress or the tops of their
                heads. Contained, the transparent margin simply becomes card.

                The padding keeps the figures inside the hairline rule rather
                than crossing it, and it is on the image itself so it shrinks
                the box `object-fit` measures against.

                `sizes` names the two real widths — 240px on a phone, 320px from
                `sm:` up — so Next serves a file for the card rather than for the
                2500px original. `preload` because on the opening screen this is
                the largest thing a guest waits for.
              */}
              <Image
                src="/hurim/bridegroom.png"
                alt=""
                fill
                preload
                sizes="(max-width: 640px) 240px, 320px"
                className="object-contain p-5 transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
            </div>

            <div className="absolute bottom-0 left-1/2 z-20 flex h-12 w-12 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border border-[#C795A0] bg-[#D9AEB8] text-white shadow-lg">
              <span className="font-invite-display text-xs">{initials}</span>
            </div>
          </div>

          {/* Clears the seal, which hangs 24px below the card. */}
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="mt-12 font-invite-serif text-[10px] uppercase tracking-[0.45em] text-[#8E6870]"
          >
            Нээх
          </motion.div>
        </motion.button>
      </div>
    </section>
  );
}
