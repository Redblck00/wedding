/**
 * Frame geometry for a photograph.
 *
 * A design cannot know what shape a couple's pictures are. A phone portrait
 * (3:4), a photographer's landscape (3:2) and the occasional panorama all land
 * in the same gallery, and giving every one of them the same frame is what cuts
 * heads off: a 3:2 picture in a phone-height frame loses more than half of its
 * width to `object-cover` before a guest ever sees it.
 *
 * So the frame takes its shape from the photograph instead. `media_assets`
 * already stores `width`/`height` for every upload and `buildInvitation` passes
 * both through, so this costs no extra request — it is arithmetic on data the
 * page already has.
 *
 * The clamp exists because "no cropping at all" is not a design: one 9:21 phone
 * screenshot would otherwise take over a whole scroll of the invitation.
 */

/** Taller than 9:16 is cropped top and bottom.
 *
 *  The two shapes a couple actually sends are a phone portrait (3:4) and a
 *  phone photograph or screenshot (9:16), and at the old 2:3 floor the second
 *  of those lost 16% of its height before a guest saw it — heads and feet, the
 *  two ends of a photograph that are worth the most. A gallery card takes its
 *  height from the viewport and its width from this ratio, so letting the floor
 *  down costs nothing but a narrower card. */
const MIN_RATIO = 9 / 16;

/** Wider than 16:9 — panoramas — is cropped at the sides. */
const MAX_RATIO = 16 / 9;

/**
 * Used when a photo has no stored dimensions.
 *
 * Not a neutral square: uploads through `POST /weddings/{id}/media` always
 * record width and height, so a missing pair means an older row or the demo
 * invitation, and 3:2 is what a camera hands over.
 */
const FALLBACK_RATIO = 3 / 2;

/** Above this a photo is treated as a landscape one. Deliberately past 1.0 —
 *  a nearly-square picture should be laid out as a square, not as a wide one. */
export const LANDSCAPE_RATIO = 1.2;

/**
 * The aspect ratio a frame should take to hold `photo` without cropping it.
 *
 * Returns a number for `style={{ aspectRatio }}` rather than a Tailwind class:
 * the value is per-photo and continuous, so a class would mean rounding every
 * picture into one of three buckets and cropping the difference.
 */
export function frameRatio(photo, { min = MIN_RATIO, max = MAX_RATIO } = {}) {
  if (!photo?.width || !photo?.height) return FALLBACK_RATIO;
  return Math.min(Math.max(photo.width / photo.height, min), max);
}

/** True for photographs that read as wide. Templates use it to decide layout —
 *  a landscape picture wants the full width of a phone, a portrait does not. */
export function isLandscape(photo) {
  return frameRatio(photo) > LANDSCAPE_RATIO;
}
