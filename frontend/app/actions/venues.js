"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { apiFetch, uploadMedia } from "@/lib/api";
import { resolveCoordinates } from "@/lib/maps";
import { getAccessToken } from "@/lib/session";

/**
 * The whole "Байршил" screen in one save: the section's copy, and the venue
 * rows themselves.
 *
 * Two different stores, deliberately. The heading and note are text and live in
 * `wedding_sections.content`; the addresses are rows in `venues` so their
 * coordinates have one source of truth and can be mapped directly. To the
 * couple it is one page, so it is one button.
 */

function blankToNull(value) {
  const trimmed = (value ?? "").trim();
  return trimmed === "" ? null : trimmed;
}

function readRows(formData) {
  const ids = formData.getAll("venue_id");
  const names = formData.getAll("venue_name");
  const addresses = formData.getAll("venue_address");
  const times = formData.getAll("venue_starts_at");
  const links = formData.getAll("venue_map_url");
  const photos = formData.getAll("venue_photo_media_id");

  const rows = [];

  for (let index = 0; index < names.length; index += 1) {
    const name = (names[index] ?? "").trim();
    const address = (addresses[index] ?? "").trim();
    const startsAt = (times[index] ?? "").trim();
    const mapUrl = (links[index] ?? "").trim();
    const photoMediaId = (photos[index] ?? "").trim();

    // A row the couple added and abandoned. Dropping it beats refusing the
    // whole save over a blank they never meant to fill. A photo alone counts as
    // filled in — the file is already in storage by the time this runs.
    if (!name && !address && !startsAt && !mapUrl && !photoMediaId) continue;

    if (!name) {
      return { error: `${index + 1}-р байршлын нэрийг бөглөнө үү.` };
    }

    rows.push({
      id: (ids[index] ?? "").trim() || null,
      name,
      address: address || null,
      starts_at: startsAt || null,
      map_url: mapUrl || null,
      // "" is what a cleared photo posts; the backend takes a UUID or null.
      photo_media_id: photoMediaId || null,
      display_order: rows.length,
    });
  }

  return { rows };
}

/**
 * Uploads a picture of one venue.
 *
 * Deliberately *not* `uploadPhoto` from `actions/gallery.js`. That one appends
 * to `gallery.media_ids`, which is the couple's own reel — a photograph of a
 * banquet hall does not belong in "Бидний мөчүүд", and putting it there would
 * also let it count toward the publish gate's minimum.
 *
 * The row is still an ordinary `media_assets` row on the same wedding, so
 * `buildInvitation` resolves it through the same pool every other picture uses.
 *
 * Uploaded immediately rather than carried by the section's save button: a file
 * cannot ride along in the same form submit without pushing the whole venue
 * screen past the action body limit.
 */
export async function uploadVenuePhoto(_previousState, formData) {
  const weddingId = formData.get("wedding_id");
  const file = formData.get("file");

  if (!file || typeof file === "string" || file.size === 0) {
    return { message: "Зураг сонгоно уу." };
  }

  const token = await getAccessToken();
  if (!token) redirect("/login?next=/dashboard");

  const { ok, status, asset, error } = await uploadMedia(weddingId, file, token);

  if (!ok) {
    if (status === 413) {
      return { message: error ?? "Зураг хэт том байна (дээд тал нь 20 MB)." };
    }
    return { message: error ?? "Зураг оруулж чадсангүй." };
  }

  // No `revalidatePath` here. The id is handed straight back to the form, which
  // is holding unsaved edits in half a dozen other fields — re-rendering the
  // page from the server would throw them away.
  return { ok: true, mediaId: asset.id, url: asset.thumbnail_url ?? asset.url };
}

/**
 * Deletes a venue's picture from storage.
 *
 * Run immediately, like the upload, and for the same reason the gallery deletes
 * immediately: the file is already in Cloudinary, so "remove" has to mean
 * something there and not only in this form's state.
 *
 * The venue row needs no separate update — `venues.photo_media_id` is
 * `ON DELETE SET NULL`, so the database clears the reference as the asset goes.
 */
export async function removeVenuePhoto(_previousState, formData) {
  const weddingId = formData.get("wedding_id");
  const mediaId = formData.get("media_id");

  const token = await getAccessToken();
  if (!token) redirect("/login?next=/dashboard");

  const { ok, error } = await apiFetch(`/weddings/${weddingId}/media/${mediaId}`, {
    method: "DELETE",
    token,
  });

  if (!ok) return { message: error };

  return { ok: true };
}

export async function saveVenueSection(_previousState, formData) {
  const weddingId = formData.get("wedding_id");

  const read = readRows(formData);
  if (read.error) return { message: read.error };

  const token = await getAccessToken();
  if (!token) redirect("/login?next=/dashboard");

  // The copy first — it is a single call and the one most likely to succeed.
  const section = await apiFetch(`/weddings/${weddingId}/sections/venue`, {
    method: "PUT",
    token,
    body: JSON.stringify({
      content: {
        heading: blankToNull(formData.get("heading")),
        note: blankToNull(formData.get("note")),
      },
    }),
  });

  if (!section.ok) return { message: section.error };

  const existing = await apiFetch(`/weddings/${weddingId}/venues`, { token });
  if (!existing.ok) return { message: existing.error };

  // Mined from whatever link the couple pasted, because the invitation's
  // embedded map is built from coordinates and falls back to a text search on
  // the name without them. Failure is soft — the venue saves regardless.
  const withCoordinates = await Promise.all(
    read.rows.map(async (row) => ({
      ...row,
      ...((row.map_url && (await resolveCoordinates(row.map_url))) || {}),
    })),
  );

  const submittedIds = new Set(withCoordinates.map((row) => row.id).filter(Boolean));

  for (const row of withCoordinates) {
    const { id, ...body } = row;

    const result = id
      ? await apiFetch(`/weddings/${weddingId}/venues/${id}`, {
          method: "PATCH",
          token,
          body: JSON.stringify(body),
        })
      : await apiFetch(`/weddings/${weddingId}/venues`, {
          method: "POST",
          token,
          body: JSON.stringify(body),
        });

    if (!result.ok) return { message: result.error };
  }

  // Deletes run last on purpose. If anything above fails the couple is left
  // with more venues than they wanted rather than fewer — the recoverable
  // direction.
  for (const venue of existing.data ?? []) {
    if (submittedIds.has(venue.id)) continue;

    const removed = await apiFetch(`/weddings/${weddingId}/venues/${venue.id}`, {
      method: "DELETE",
      token,
    });
    if (!removed.ok) return { message: removed.error };
  }

  revalidatePath(`/weddings/${weddingId}`);
  revalidatePath(`/weddings/${weddingId}/sections/venue`);

  return { ok: true };
}
