import RoseEnvelope from "./rose-envelope";

/**
 * Every invitation design the deployed frontend can draw, keyed by
 * `templates.code` in the database.
 *
 * This dispatcher is the reason that column exists. A template's id is a UUID
 * the database generates, so it differs between a developer's machine and
 * production — a registry keyed on one would resolve locally and 404 for real
 * guests. The code is written here and in the seed script by hand, so the two
 * sides cannot drift apart silently.
 *
 * Adding a design means: a folder next to this file, a `case` below, its code in
 * `CODES`, and a matching `TemplateSpec` in `backend/scripts/seed_templates.py`.
 */

/** Codes this build can render — used by the catalogue and to prerender previews. */
const CODES = ["rose-envelope"];

export function hasTemplate(code) {
  return CODES.includes(code);
}

export function availableTemplateCodes() {
  return CODES;
}

/**
 * Renders the design named by `code`, or `fallback` when this build does not
 * ship it.
 *
 * A `switch` returning JSX rather than a `{ code: Component }` lookup: pulling a
 * component out of a map during render is what `react-hooks/static-components`
 * forbids, because React cannot guarantee the identity is stable across renders
 * and would silently remount the subtree — losing, among other things, whether
 * the guest has opened the envelope.
 *
 * A code can be in the catalogue but not here: the backend deploys separately,
 * and the seeded starter templates have codes with no component yet.
 */
export function InvitationTemplate({ code, invitation, preview = false, fallback = null }) {
  switch (code) {
    case "rose-envelope":
      return <RoseEnvelope invitation={invitation} preview={preview} />;
    default:
      return fallback;
  }
}
