"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

import Countdown from "./countdown";
import CoupleReveal from "./couple-reveal";
import Envelope from "./envelope";
import FinalScene from "./final-scene";
import { cormorantInvite, jost, playfair } from "./font";
import FloatingFlowers from "./floating-flowers";
import GoogleMap from "./google-map";
import IntroductionDecorations from "./introduction-decorations";
import MusicPlayer from "./music-player";
import Rsvp from "./rsvp";
import Timeline from "./timeline";
import VenueSection from "./venue-section";
import WeddingFooter from "./wedding-footer";

/** "Сарнай", "Болд" -> "С & Б" — what goes on the wax seal. */
function initialsOf(bride, groom) {
  const first = (name) => (name ? [...name][0] : "");
  return [first(bride), first(groom)].filter(Boolean).join(" & ");
}

/**
 * The type size for the couple's names on the opening screen.
 *
 * Mongolian names run long — "Үүрийнцолмон" is twelve characters where "Болд"
 * is four — and one fixed size cannot serve both. At the old `text-6xl` a
 * twelve-character name is about 430px of type on a 390px phone: it broke out
 * of the column, wrapped mid-name and took the layout with it.
 *
 * So the size is chosen from the longer of the two names, and each step is a
 * `clamp()` on top of that so it still answers to the viewport. Counted with a
 * spread rather than `.length`, which counts UTF-16 units and would read a
 * surrogate pair as two characters.
 *
 * Deterministic — the same string gives the same class on the server and in the
 * browser, so nothing here can cause a hydration mismatch.
 */
function nameSize(bride, groom) {
  const longest = Math.max([...(bride ?? "")].length, [...(groom ?? "")].length);

  if (longest > 11) return "text-[clamp(1.9rem,8.5vw,5rem)]";
  if (longest > 8) return "text-[clamp(2.2rem,10vw,6rem)]";
  return "text-[clamp(2.6rem,12vw,7rem)]";
}

/**
 * The "rose-envelope" design.
 *
 * Renders one `invitation` object — see `lib/invitation.js`. It never fetches
 * and never reads the API's own field names, so the same component serves the
 * live guest page and the marketplace preview.
 */
export default function RoseEnvelope({ invitation, preview = false }) {
  const [opened, setOpened] = useState(false);

  // Native scroll only. Lenis (especially syncTouch) fought the sticky
  // Timeline / FinalScene tracks and made wheel + touch feel stuck.

  const {
    brideName,
    groomName,
    displayDate,
    startsAt,
    story,
    schedule,
    venues,
    venueHeading,
    venueNote,
    gallery,
    heroPhoto,
    finalScene,
    rsvp,
    music,
    bride,
    groom,
  } = invitation;

  const phones = [bride.phone, groom.phone].filter(Boolean);

  return (
    <main
      className={`${playfair.variable} ${cormorantInvite.variable} ${jost.variable} font-invitation min-h-screen overflow-x-clip bg-[#FFF0F5] text-[#5F4148]`}
    >
      <AnimatePresence mode="wait">
        {!opened ? (
          <motion.section
            key="envelope"
            exit={{ opacity: 0, scale: 1.04, filter: "blur(12px)" }}
            transition={{ duration: 1.2 }}
            className="relative"
          >
            <FloatingFlowers />

            <Envelope
              brideName={brideName}
              groomName={groomName}
              initials={initialsOf(brideName, groomName)}
              onOpen={() => setOpened(true)}
            />
          </motion.section>
        ) : (
          /*
            Opacity only. A lingering `transform` or `filter` on this wrapper
            makes it the containing block for sticky descendants — Timeline and
            FinalScene would then scroll away as empty 200vh slabs instead of
            pinning to the viewport while their scroll progress animates.
          */
          <motion.section
            key="website"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.4, delay: 0.3 }}
          >
            <section className="relative flex min-h-screen-safe items-center justify-center overflow-hidden px-6 text-center">
              {/*
                The chosen photograph, full bleed and at full strength — no wash
                and no tint over it, so it looks like the picture the couple
                uploaded rather than a pink version of it.

                Where the crop is taken from has to change with the screen,
                because which way the photograph is being squeezed changes with
                it.

                On a phone the viewport is portrait and so is the photograph, so
                `cover` trims a little from the sides and the middle is exactly
                right — that is where a couple stands in almost every wedding
                picture, and anchoring to the top or bottom would frame a sky or
                a floor instead.

                On a notebook the viewport is landscape and the photograph still
                is not. Covering the width scales it far taller than the screen,
                and now the trim is vertical and severe: the middle of a portrait
                is the dress and the hands, and the faces are above the cut. Same
                photograph, opposite problem.

                So from `md:` up the crop moves toward the top — but not all the
                way to it. `object-top` overshot: the top of a studio portrait is
                ceiling and curtain, and pinning there pushed the couple back
                down out of frame from the other side.

                `20%` is the one number to tune. It reads as "line up the point a
                fifth of the way down the photograph with the point a fifth of
                the way down the screen", so raising it takes the crop from
                further down the picture and lifts the subject up the screen;
                lowering it does the reverse. Nothing else here has to change
                with it.

                Legibility is carried entirely by the type instead — white with a
                shadow, below. That is the one treatment that costs the
                photograph nothing, because it never touches it.
              */}
              {heroPhoto ? (
                <div aria-hidden className="absolute inset-0 z-0">
                  <Image
                    src={heroPhoto.url}
                    alt=""
                    fill
                    // The largest thing on screen the moment the envelope
                    // opens, so it is worth fetching ahead of the rest.
                    preload
                    sizes="100vw"
                    className="object-cover object-center md:object-[50%_20%]"
                  />
                </div>
              ) : null}

              {/* <IntroductionDecorations /> */}
              {/* <FloatingFlowers /> */}

              {/*
                Over a photograph the type goes white and carries its own shadow;
                with no photograph it keeps the plum-on-pink palette the rest of
                the page uses.

                The shadow is set once here and inherited, rather than per line —
                `text-shadow` inherits, and four copies of the same value is four
                places to forget one.
              */}
              <div
                className="relative z-20"
                style={
                  heroPhoto
                    ? { textShadow: "0 1px 3px rgba(38,18,24,0.45), 0 2px 28px rgba(38,18,24,0.6)" }
                    : undefined
                }
              >
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className={`font-invite-serif text-[10px] uppercase tracking-[0.5em] ${
                    heroPhoto ? "text-white/85" : "text-[#A77B83]"
                  }`}
                >
                Сайн байна уу
                </motion.p>

                <motion.h1
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, duration: 1 }}
                  className={`mt-7 font-invite-display leading-[1.05] ${
                    heroPhoto ? "text-white" : "text-[#694951]"
                  } ${nameSize(brideName, groomName)}`}
                >
                  {/*
                    Stacked on a phone, on one line from `sm` up. Two long
                    Mongolian names side by side need about 950px of width; a
                    phone has 342. Giving each its own line is also how a printed
                    invitation sets them, so nothing is lost.

                    The ampersand is sized in `em`, not a fixed `text-3xl`, so it
                    stays in proportion as the names resize around it.
                  */}
                  <span className="block sm:inline">{brideName}</span>
                  <span className="my-1 block font-invite-serif text-[0.42em] sm:mx-4 sm:my-0 sm:inline">
                    &
                  </span>
                  <span className="block sm:inline">{groomName}</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className={`mt-8 font-invite-serif text-sm tracking-[0.35em] ${
                    heroPhoto ? "text-white/85" : "text-[#916C74]"
                  }`}
                >
                  {displayDate}
                </motion.p>

                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`mt-24 font-invite-serif text-[9px] uppercase tracking-[0.5em] ${
                    heroPhoto ? "text-white/75" : "text-[#B18A91]"
                  }`}
                >
                  Доош гүйлгэнэ үү
                </motion.div>
              </div>
            </section>

            <CoupleReveal
              photos={gallery.photos}
              intro={story.intro}
              quote={story.entries?.[0]?.text ?? null}
            />

            <Countdown targetDate={startsAt} />

            <Timeline entries={schedule} displayDate={displayDate} />

            <VenueSection
              title={venueHeading || "Хаана болох вэ?"}
              subtitle={venueNote}
              venues={venues}
            />

            <GoogleMap venue={venues[0]} />

            <Rsvp
              slug={invitation.slug}
              heading={rsvp.heading}
              deadline={rsvp.deadline}
              askGuestCount={rsvp.askGuestCount}
              customQuestion={rsvp.customQuestion}
              preview={preview}
            />

            <FinalScene
              photoUrl={finalScene.photoUrl}
              brideName={brideName}
              groomName={groomName}
              displayDate={displayDate}
              subtitle={finalScene.subtitle}
            />

            <WeddingFooter
              displayDate={displayDate}
              brideName={brideName}
              groomName={groomName}
              phones={phones}
            />

          </motion.section>
        )}
      </AnimatePresence>

      {/*
        Deliberately outside the invitation content tree. A parent with
        `filter` / `transform` (envelope exit still uses both) becomes the
        containing block for `position: fixed`, and the player would sink to
        the bottom of that tall tree instead of floating over the viewport.
      */}
      {opened ? (
        <MusicPlayer
          videoId={music?.youtubeVideoId}
          loop={music?.loop}
          startSeconds={music?.startSeconds}
          // Honoured because `opened` can only become true by tapping the
          // envelope, and that tap is the user activation browsers require
          // before they will let a page make sound.
          autoplay={music?.autoplay}
        />
      ) : null}
    </main>
  );
}
