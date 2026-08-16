/**
 * Pulling coordinates out of a Google Maps link.
 *
 * Why bother: the invitation's embedded map is built from `latitude` /
 * `longitude` and falls back to a *text search* on the venue's name and address
 * when they are missing. In Ulaanbaatar that search regularly lands on the
 * wrong building, so a link the couple pasted is worth mining for the real
 * numbers even though `map_url` is stored either way.
 */

/** Hosts whose redirects are worth following. Anything else is left alone. */
const SHORT_LINK_HOSTS = new Set(["maps.app.goo.gl", "goo.gl", "maps.google.com"]);

const PATTERNS = [
  // `!3d47.9!4d106.9` — the place Google actually resolved to. Most accurate,
  // so it is tried first.
  /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
  // `@47.9,106.9,17z` — the centre of the map view. Close, not exact.
  /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
  // `?q=47.9,106.9` and `&ll=47.9,106.9`
  /[?&](?:q|ll|center)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
];

function inRange(latitude, longitude) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180 &&
    // 0,0 is in the Atlantic. It is never a Mongolian wedding venue, and it is
    // what a malformed link most often parses down to.
    !(latitude === 0 && longitude === 0)
  );
}

/** Coordinates from a URL's own text, or null. No network. */
export function coordinatesFrom(url) {
  if (typeof url !== "string" || !url) return null;

  for (const pattern of PATTERNS) {
    const match = url.match(pattern);
    if (!match) continue;

    const latitude = Number(match[1]);
    const longitude = Number(match[2]);
    if (inRange(latitude, longitude)) return { latitude, longitude };
  }

  return null;
}

/**
 * Coordinates from a link, following a Google short link once if needed.
 *
 * The share button on Google Maps for Android and iOS — which is how a couple
 * will actually get this link — produces `maps.app.goo.gl/…`, which carries no
 * coordinates at all. Resolving it is the difference between the invitation
 * showing the right building and showing a text search.
 *
 * Restricted to Google's own hosts and given a short timeout: this fetch is
 * driven by a string a user pasted, and following it anywhere would make this
 * app a request proxy. Every failure is soft — the venue still saves, just
 * without coordinates.
 */
export async function resolveCoordinates(url) {
  const direct = coordinatesFrom(url);
  if (direct) return direct;

  let host;
  try {
    host = new URL(url).hostname;
  } catch {
    return null;
  }

  if (!SHORT_LINK_HOSTS.has(host)) return null;

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    return coordinatesFrom(response.url);
  } catch {
    return null;
  }
}
