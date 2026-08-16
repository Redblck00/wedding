/**
 * Turns `GET /v1/wedding/{slug}` into the shape a template component renders.
 *
 * Every template reads *this* object, never the raw API response. The API is
 * shaped around how the editor stores an invitation — sections in a list keyed
 * by type, photos in a flat pool referenced by id — and a design should not have
 * to re-derive that on every render. Putting the translation here also means a
 * new field reaches all templates at once.
 *
 * Nothing in here throws on missing data. A guest can open an invitation the
 * moment it is published, when most sections are still empty, so every getter
 * returns `null` or an empty array rather than blowing up the page.
 */

const SECTION = {
  brideInfo: "bride_info",
  groomInfo: "groom_info",
  weddingStory: "wedding_story",
  eventSchedule: "event_schedule",
  venue: "venue",
  gallery: "gallery",
  rsvpForm: "rsvp_form",
  backgroundMusic: "background_music",
  giftInfo: "gift_info",
  dressCode: "dress_code",
};

/**
 * "2026-11-11" + "17:00:00" -> "2026-11-11T17:00:00".
 *
 * Deliberately without a timezone suffix, so the browser reads it as local
 * time. `weddings.wedding_date` is a bare DATE and the ceremony time comes from
 * the schedule — neither carries an offset, and appending `Z` would shift the
 * countdown by the guest's UTC offset (in Mongolia, eight hours early).
 */
function toLocalDateTime(date, time) {
  if (!date) return null;
  return `${date}T${time ?? "00:00:00"}`;
}

/** "2026-11-11" -> "11 · 11 · 2026". */
function formatDisplayDate(date) {
  if (!date) return "";
  const [year, month, day] = date.split("-");
  return `${day} · ${month} · ${year}`;
}

/** "17:00:00" -> "17:00". Templates show a clock, never seconds. */
function formatTime(time) {
  if (!time) return null;
  return time.slice(0, 5);
}

export function buildInvitation(wedding) {
  const sections = new Map(
    (wedding.sections ?? []).map((section) => [section.section_type, section.content ?? {}]),
  );
  const section = (type) => sections.get(type) ?? {};

  // Photos arrive as one flat pool; sections and venues point into it by id.
  const mediaById = new Map((wedding.media_assets ?? []).map((asset) => [asset.id, asset]));

  const schedule = (section(SECTION.eventSchedule).entries ?? []).map((entry) => ({
    title: entry.title ?? "",
    startsAt: formatTime(entry.starts_at),
    endsAt: formatTime(entry.ends_at),
    description: entry.description ?? null,
  }));

  const bride = section(SECTION.brideInfo);
  const groom = section(SECTION.groomInfo);
  const venueCopy = section(SECTION.venue);
  const gallery = section(SECTION.gallery);
  const rsvp = section(SECTION.rsvpForm);
  const music = section(SECTION.backgroundMusic);
  const story = section(SECTION.weddingStory);
  const gift = section(SECTION.giftInfo);
  const dressCode = section(SECTION.dressCode);

  return {
    slug: wedding.slug,

    // `bride_name` on the wedding row is what the couple typed when they picked
    // their URL; the section's `name` is the fuller one they may have edited
    // since. Prefer the section, fall back to the row.
    brideName: bride.name || wedding.bride_name || "",
    groomName: groom.name || wedding.groom_name || "",

    /** ISO local datetime for the countdown — the day plus the first schedule entry. */
    startsAt: toLocalDateTime(wedding.wedding_date, schedule[0]?.startsAt ?? null),
    displayDate: formatDisplayDate(wedding.wedding_date),

    bride: {
      name: bride.name ?? null,
      photoUrl: bride.photo_url ?? null,
      bio: bride.bio ?? null,
      parents: bride.parents ?? null,
      // `SectionContent` allows extra keys, so a template may ask for a field
      // the backend has no column for — a contact number is the common one.
      phone: bride.phone ?? null,
    },
    groom: {
      name: groom.name ?? null,
      photoUrl: groom.photo_url ?? null,
      bio: groom.bio ?? null,
      parents: groom.parents ?? null,
      phone: groom.phone ?? null,
    },

    story: {
      intro: story.intro ?? null,
      entries: story.entries ?? [],
    },

    schedule,

    venueHeading: venueCopy.heading ?? null,
    venueNote: venueCopy.note ?? null,

    // Ceremony and reception are not separate sections — `wedding_sections` is
    // UNIQUE on (wedding_id, section_type), so there is exactly one venue
    // section. The individual locations are rows, ordered by the couple.
    venues: (wedding.venues ?? []).map((venue) => ({
      id: venue.id,
      name: venue.name,
      address: venue.address ?? null,
      startsAt: formatTime(venue.starts_at),
      photoUrl: mediaById.get(venue.photo_media_id)?.url ?? null,
      mapUrl: venue.map_url ?? null,
      latitude: venue.latitude ?? null,
      longitude: venue.longitude ?? null,
    })),

    // The closing panel. Both keys are stored on the gallery section as extra
    // fields — `SectionContent` is `extra="allow"` and preserves unknown keys on
    // round-trip, so neither needed a column or a new section type.
    //
    // `final_media_id` is an id into the same photo pool, never a URL: only a
    // `media_assets` row carries the cloudinary_public_id that keeps the file
    // deletable. It falls back to the last gallery photo so the panel works
    // before the couple has picked one.
    finalScene: {
      photoUrl:
        mediaById.get(gallery.final_media_id)?.url ??
        (gallery.media_ids ?? []).map((id) => mediaById.get(id)?.url).filter(Boolean).at(-1) ??
        null,
      subtitle: gallery.final_subtitle ?? null,
    },

    /**
     * The photograph a design puts behind its opening screen.
     *
     * An id into the same pool as `finalScene`, for the same reason: only a
     * `media_assets` row carries the cloudinary_public_id that keeps the file
     * deletable, so a URL stored in section content would leak the file.
     *
     * Falls back to the first gallery photo — `media_ids` is ordered by the
     * couple, so the first one is already the picture they put forward — and
     * then to null, because a couple can publish before uploading anything.
     */
    heroPhoto: (() => {
      const photo =
        mediaById.get(gallery.hero_media_id) ??
        (gallery.media_ids ?? []).map((id) => mediaById.get(id)).find(Boolean) ??
        null;

      return photo
        ? {
            id: photo.id,
            url: photo.url,
            width: photo.width ?? null,
            height: photo.height ?? null,
          }
        : null;
    })(),

    gallery: {
      layout: gallery.layout ?? "grid",
      // `media_ids` is the source of truth for which photos show and in what
      // order — `media_assets.section_id` only records where a file was
      // uploaded. Ids that no longer resolve are dropped rather than rendered
      // as broken images.
      photos: (gallery.media_ids ?? [])
        .map((id) => mediaById.get(id))
        .filter(Boolean)
        .map((asset) => ({
          id: asset.id,
          url: asset.url,
          thumbnailUrl: asset.thumbnail_url ?? asset.url,
          width: asset.width ?? null,
          height: asset.height ?? null,
        })),
    },

    rsvp: {
      heading: rsvp.heading ?? null,
      deadline: rsvp.deadline ?? null,
      askGuestCount: rsvp.ask_guest_count ?? true,
      customQuestion: rsvp.custom_question ?? null,
    },

    // Null when the couple pasted no link. Templates must render no player at
    // all in that case — an empty embed is worse than nothing.
    music: music.youtube_video_id
      ? {
          youtubeVideoId: music.youtube_video_id,
          startSeconds: music.start_seconds ?? 0,
          autoplay: music.autoplay ?? false,
          loop: music.loop ?? true,
        }
      : null,

    gift: {
      message: gift.message ?? null,
      accounts: gift.accounts ?? [],
    },

    dressCode: {
      description: dressCode.description ?? null,
      colors: dressCode.colors ?? [],
      referenceImageUrl: dressCode.reference_image_url ?? null,
    },
  };
}
