import IntroductionDecorations from "./introduction-decorations";
import Reveal from "./reveal";

/**
 * An embedded map of the main venue.
 *
 * Server component — there is nothing interactive here beyond the iframe
 * itself, so it costs the guest no JavaScript.
 *
 * Uses Google's keyless `?q=…&output=embed` form on purpose: the Maps
 * Embed API needs a key, and a key shipped in a public invitation page is a key
 * anyone can spend.
 */
export default function GoogleMap({ venue }) {
  if (!venue) return null;

  const query =
    venue.latitude != null && venue.longitude != null
      ? `${venue.latitude},${venue.longitude}`
      : [venue.name, venue.address].filter(Boolean).join(", ");

  if (!query) return null;

  return (
    <section className="relative overflow-hidden bg-[#F9E7EC] px-6 py-24">
      <IntroductionDecorations />

      <div className="relative z-20 mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <Reveal>
            <p className="font-invite-serif text-[10px] uppercase tracking-[0.5em] text-[#A77B83]">
              Байршил
            </p>
          </Reveal>

          <Reveal delay={150} className="mt-4">
            <h2 className="font-invite-display text-5xl text-[#694951]">{venue.name}</h2>
          </Reveal>

          {venue.address ? (
            <Reveal delay={300} className="mt-4">
              <p className="font-invite-serif text-sm text-[#916C74]">{venue.address}</p>
            </Reveal>
          ) : null}
        </div>

        <div className="overflow-hidden border border-[#DABDC3] bg-white p-2 shadow-xl">
          <iframe
            src={`https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`}
            width="100%"
            height="500"
            loading="lazy"
            // Google's embed sets a referrer-dependent tile URL; without this it
            // occasionally serves a "for development purposes only" watermark.
            referrerPolicy="no-referrer-when-downgrade"
            className="border-0"
            title={`${venue.name} байршил`}
          />
        </div>
      </div>
    </section>
  );
}
