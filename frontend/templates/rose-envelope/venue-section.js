"use client";

import Image from "next/image";

import IntroductionDecorations from "./introduction-decorations";
import Reveal from "./reveal";

/**
 * Builds the best link we can to a location.
 *
 * A `map_url` the couple pasted from Google's own share button is always the
 * most accurate, so it wins. Coordinates are next — they are unambiguous where
 * a Mongolian address often is not. The typed name is the last resort.
 */
function mapHref(venue) {
  if (venue.mapUrl) return venue.mapUrl;

  const query =
    venue.latitude != null && venue.longitude != null
      ? `${venue.latitude},${venue.longitude}`
      : [venue.name, venue.address].filter(Boolean).join(", ");

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * The locations, as a horizontal snap-scroll of cards.
 *
 * Ceremony and reception are *not* separate sections — an invitation has one
 * venue section and many venue rows, ordered by the couple. A card without a
 * photo still renders; the couple may fill those in after publishing.
 */
export default function VenueSection({ title, subtitle, venues }) {
  if (!venues?.length) return null;

  return (
    <section className="relative overflow-hidden bg-[#FFF0F5] px-6 py-28">
      <IntroductionDecorations />

      <div className="relative z-20 mx-auto max-w-7xl">
        <div className="mb-12">
          {subtitle ? (
            <Reveal>
              <p className="font-invite-serif text-[10px] uppercase tracking-[0.5em] text-[#A77B83]">
                {subtitle}
              </p>
            </Reveal>
          ) : null}

          <Reveal delay={150} className="mt-5">
            <h2 className="font-invite-display text-5xl text-[#694951] md:text-7xl">{title}</h2>
          </Reveal>
        </div>

        <div className="scrollbar-hide flex snap-x snap-mandatory gap-6 overflow-x-auto pb-8">
          {venues.map((venue) => (
            <div
              key={venue.id}
              className="w-[82vw] max-w-[460px] flex-none snap-start sm:w-[420px]"
            >
              <div className="group relative aspect-[4/5] overflow-hidden bg-[#F2DDE3]">
                {venue.photoUrl ? (
                  <Image
                    src={venue.photoUrl}
                    alt={venue.name}
                    fill
                    // Without `sizes` Next assumes the image fills the viewport
                    // and ships a needlessly large file to every phone.
                    sizes="(max-width: 640px) 82vw, 420px"
                    // `md:` on the hover zoom: on a touch screen `:hover`
                    // latches on tap and stays until something else is tapped,
                    // so this read as a venue photo that had zoomed in and
                    // would not zoom back out.
                    className="object-cover transition-transform duration-1000 md:group-hover:scale-105"
                  />
                ) : (
                  <div
                    aria-hidden
                    className="flex h-full items-center justify-center text-6xl text-[#C99DA6]/40"
                  >
                    ❀
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-7 text-white">
                  {venue.startsAt ? (
                    <p className="font-invite-serif text-[9px] uppercase tracking-[0.35em] opacity-80">
                      {venue.startsAt}
                    </p>
                  ) : null}

                  <h3 className="mt-2 font-invite-display text-3xl">{venue.name}</h3>

                  {venue.address ? (
                    <p className="mt-3 font-invite-serif text-xs opacity-80">{venue.address}</p>
                  ) : null}
                </div>
              </div>

              <a
                href={mapHref(venue)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block font-invite-serif text-[9px] uppercase tracking-[0.3em] text-[#8F6971]"
              >
                Газрын зураг дээр харах →
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
