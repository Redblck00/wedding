/**
 * Which section types have an editor yet.
 *
 * Lives here rather than beside either page that needs it: the overview reads
 * it to decide whether a row is a link, and the editor route reads it to reject
 * anything else. Importing one page module from another would drag that page's
 * whole client graph along with it.
 *
 * Not derivable from `template.contents` — that says what the *design* shows,
 * which is a different question from what this app can yet edit. Add a type
 * here at the same time as its builder in `app/actions/sections.js`.
 */
export const EDITABLE_SECTIONS = new Set([
  "bride_info",
  "groom_info",
  "event_schedule",
  "venue",
  "gallery",
  "background_music",
  "wedding_story",
  "rsvp_form",
]);

export function isEditableSection(sectionType) {
  return EDITABLE_SECTIONS.has(sectionType);
}
