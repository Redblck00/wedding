"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/session";

/**
 * Builds a section's `content` from its form.
 *
 * One entry per section type, because each has a different shape — that is the
 * whole reason `wedding_sections.content` is JSONB rather than columns. A type
 * with no builder here has no editor yet, and the action refuses rather than
 * writing an empty body over whatever the couple already had.
 *
 * Each returns `{ content }`, or `{ error }` when the form says something the
 * backend would only reject as a 422 naming a field the couple never saw.
 *
 * Empty strings become `null`: `_is_filled` — and so the publish gate — counts
 * a stored "" as unfilled anyway, and null is the honest representation.
 */
const CONTENT_BUILDERS = {
  bride_info: personContent,
  groom_info: personContent,
  event_schedule: scheduleContent,
  background_music: musicContent,
  wedding_story: storyContent,
  rsvp_form: rsvpContent,
};

function blankToNull(value) {
  const trimmed = (value ?? "").trim();
  return trimmed === "" ? null : trimmed;
}

function personContent(formData) {
  return {
    content: {
      name: blankToNull(formData.get("name")),
      phone: blankToNull(formData.get("phone")),
    },
  };
}

/**
 * The running order, read back out of a variable-length form.
 *
 * `getAll` returns values in DOM order, and every row renders all three inputs
 * even when empty, so the three lists stay index-aligned. A row deleted in the
 * browser is simply not rendered, which keeps that alignment without any
 * bookkeeping.
 *
 * `title` is the one required field on `ScheduleEntry`. A row with nothing in
 * it at all is one the couple added and abandoned — dropped rather than
 * refused. A row with a time or a note but no title is a real mistake and is
 * named, because the backend's 422 would only say "entries.2.title".
 */
function scheduleContent(formData) {
  const titles = formData.getAll("entry_title");
  const times = formData.getAll("entry_starts_at");
  const notes = formData.getAll("entry_description");

  const entries = [];

  for (let index = 0; index < titles.length; index += 1) {
    const title = (titles[index] ?? "").trim();
    const startsAt = (times[index] ?? "").trim();
    const description = (notes[index] ?? "").trim();

    if (!title && !startsAt && !description) continue;

    if (!title) {
      return { error: `${index + 1}-р мөрийн нэрийг бөглөнө үү.` };
    }

    entries.push({
      title,
      starts_at: startsAt || null,
      description: description || null,
    });
  }

  return { content: { entries } };
}

/**
 * The background track.
 *
 * Whatever the couple pasted goes through untouched: `section_service` runs it
 * through `extract_video_id`, which accepts a watch, share, embed, shorts or
 * live URL — or a bare id — and stores only the id. Parsing it here as well
 * would be a second implementation to keep in step.
 *
 * `autoplay` is honoured by this design: the guest reaches the invitation by
 * tapping the envelope, and that tap is the user activation browsers require
 * before a page may make sound. It is still best-effort — see `MusicPlayer`.
 */
/**
 * The start offset is typed as `1:15`, or as plain seconds.
 *
 * A colon is how anyone reads a position in a song, and it is what YouTube
 * prints under the player — asking for 75 when the screen says 1:15 is asking
 * the couple to do arithmetic. Both forms are accepted; anything else becomes
 * null rather than a guess, and the backend's own bounds still apply.
 */
function toSeconds(value) {
  const raw = (value ?? "").trim();
  if (raw === "") return null;

  const parts = raw.split(":");
  if (parts.length > 3 || parts.some((part) => !/^\d+$/.test(part))) return null;

  // Right to left, so "1:15" is minutes and seconds while "1:02:03" is hours,
  // minutes and seconds — the same way the timestamps YouTube prints grow.
  const seconds = parts
    .reverse()
    .reduce((total, part, index) => total + Number(part) * 60 ** index, 0);

  return Number.isFinite(seconds) ? seconds : null;
}

function musicContent(formData) {
  const pasted = (formData.get("youtube_video_id") ?? "").trim();

  return {
    content: {
      youtube_video_id: pasted || null,
      start_seconds: toSeconds(formData.get("start_seconds")),
      autoplay: formData.get("autoplay") === "on",
      loop: formData.get("loop") === "on",
    },
  };
}

/**
 * The couple's story: an opening paragraph and one pull-quote.
 *
 * `WeddingStoryContent.entries` is a list, and `StoryEntry` carries a title, a
 * date and a photo as well as its text — but this design prints only
 * `entries[0].text`, as the quote beside the second photograph. Offering a
 * whole timeline here would have the couple write a history no guest sees.
 *
 * This form is the only writer of the section, so replacing the list wholesale
 * cannot discard anything another screen put there.
 */
function storyContent(formData) {
  const quote = blankToNull(formData.get("quote"));

  return {
    content: {
      intro: blankToNull(formData.get("intro")),
      entries: quote ? [{ text: quote }] : [],
    },
  };
}

/** The reply form's own wording. Every field here is printed by the design. */
function rsvpContent(formData) {
  return {
    content: {
      heading: blankToNull(formData.get("heading")),
      // `<input type="date">` posts "YYYY-MM-DD", which is what the backend's
      // `date` field parses. Empty means no deadline, not an invalid one.
      deadline: blankToNull(formData.get("deadline")),
      ask_guest_count: formData.get("ask_guest_count") === "on",
      custom_question: blankToNull(formData.get("custom_question")),
    },
  };
}

/**
 * Which wedding-row column, if any, mirrors this section's name.
 *
 * `weddings.bride_name` is chosen when the invitation is created — it is what
 * the dashboard lists and what the couple saw next to their URL. The section
 * holds the invitation's own copy, and `buildInvitation` prefers it. Two copies
 * that can disagree is a trap, so saving one updates the other.
 */
const NAME_MIRROR = {
  bride_info: "bride_name",
  groom_info: "groom_name",
};

export async function saveSection(_previousState, formData) {
  const weddingId = formData.get("wedding_id");
  const sectionType = formData.get("section_type");

  const build = CONTENT_BUILDERS[sectionType];
  if (!build) {
    return { message: "Энэ хэсгийг засварлах боломж хараахан нэмэгдээгүй байна." };
  }

  const built = build(formData);
  if (built.error) return { message: built.error };

  const token = await getAccessToken();
  if (!token) redirect("/login?next=/dashboard");

  const content = built.content;

  const { ok, status, error } = await apiFetch(`/weddings/${weddingId}/sections/${sectionType}`, {
    method: "PUT",
    token,
    body: JSON.stringify({ content }),
  });

  if (!ok) {
    // The backend's 422 for an unreadable link quotes the raw string back in
    // English — accurate, but not something to show a couple who just pasted
    // the wrong thing from a browser tab.
    if (status === 422 && sectionType === "background_music") {
      return {
        message: "YouTube холбоос танигдсангүй. Бичлэгийн хаягийг бүтнээр нь буулгана уу.",
        values: content,
      };
    }
    return { message: error, values: content };
  }

  // Mirrored after the section, not before: the section is what guests see, so
  // if only one of the two writes can land it should be that one. A failure
  // here leaves the dashboard showing the older name, which is cosmetic — but
  // it is still reported rather than swallowed.
  const mirror = NAME_MIRROR[sectionType];
  if (mirror && content.name) {
    const mirrored = await apiFetch(`/weddings/${weddingId}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ [mirror]: content.name }),
    });

    if (!mirrored.ok) {
      return { ok: true, message: "Хадгалагдлаа. Жагсаалтын нэр хуучин хэвээр байж магадгүй." };
    }
  }

  revalidatePath("/dashboard");
  revalidatePath(`/weddings/${weddingId}`);
  revalidatePath(`/weddings/${weddingId}/sections/${sectionType}`);

  return { ok: true, values: content };
}
