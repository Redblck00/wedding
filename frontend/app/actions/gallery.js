"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { apiFetch, uploadMedia } from "@/lib/api";
import { getAccessToken } from "@/lib/session";

/**
 * The photo album.
 *
 * Two stores again. `media_assets` rows are the files; `gallery.media_ids` is
 * the display list, and the guest page renders that list — not the pool. A
 * photo uploaded but left out of `media_ids` would be invisible on the
 * invitation *and* uncounted by the publish gate, so uploading appends to the
 * list in the same action. The couple never has to know the difference.
 */

async function requireToken() {
  const token = await getAccessToken();
  if (!token) redirect("/login?next=/dashboard");
  return token;
}

async function readGallery(weddingId, token) {
  const { ok, data, error } = await apiFetch(`/weddings/${weddingId}/sections`, { token });
  if (!ok) return { error };

  const gallery = (data ?? []).find((section) => section.section_type === "gallery");
  return { content: gallery?.content ?? {} };
}

function refresh(weddingId) {
  revalidatePath(`/weddings/${weddingId}`);
  revalidatePath(`/weddings/${weddingId}/sections/gallery`);
}

/**
 * Uploads one photograph and puts it at the end of the album.
 *
 * One file per call: the action body limit counts the whole request, so a
 * multi-file submit would be measured on the total. The client sends them in
 * sequence, which also lets each one appear as it lands rather than after the
 * slowest.
 *
 * The append is what makes this the *gallery's* upload rather than a general
 * one — a photo that reaches `media_assets` but not `media_ids` is invisible on
 * the invitation and uncounted by the publish gate. `uploadVenuePhoto` is the
 * deliberate exception: a picture of the hall belongs to a venue, not to the
 * couple's reel.
 */
export async function uploadPhoto(_previousState, formData) {
  const weddingId = formData.get("wedding_id");
  const file = formData.get("file");

  if (!file || typeof file === "string" || file.size === 0) {
    return { message: "Зураг сонгоно уу." };
  }

  const token = await requireToken();

  const { ok, status, asset, error } = await uploadMedia(weddingId, file, token);

  if (!ok) {
    if (status === 413) {
      return { message: error ?? "Зураг хэт том байна (дээд тал нь 20 MB)." };
    }
    return { message: error ?? "Зураг оруулж чадсангүй." };
  }

  const gallery = await readGallery(weddingId, token);
  if (gallery.error) return { message: gallery.error };

  const mediaIds = [...(gallery.content.media_ids ?? []), asset.id];

  const saved = await apiFetch(`/weddings/${weddingId}/sections/gallery`, {
    method: "PUT",
    token,
    body: JSON.stringify({ content: { ...gallery.content, media_ids: mediaIds } }),
  });

  if (!saved.ok) return { message: saved.error };

  refresh(weddingId);
  return { ok: true };
}

/**
 * Removes a photograph for good — from the album, from storage, and from the
 * opening screen or closing panel if it was the one chosen there.
 *
 * Only the DELETE is needed: `routers/media.py` drops the id out of
 * `media_ids` and clears `hero_media_id` / `final_media_id` itself, because a
 * dangling id in any of the three is a broken picture on a published
 * invitation.
 */
export async function deletePhoto(_previousState, formData) {
  const weddingId = formData.get("wedding_id");
  const mediaId = formData.get("media_id");

  const token = await requireToken();

  const { ok, error } = await apiFetch(`/weddings/${weddingId}/media/${mediaId}`, {
    method: "DELETE",
    token,
  });

  if (!ok) return { message: error };

  refresh(weddingId);
  return { ok: true };
}

/**
 * Saves the running order, which photograph opens the invitation and which one
 * closes it.
 *
 * Both chosen ids are validated against `media_ids` by the backend, so all three
 * are submitted together — sending a chosen photo that is no longer in the album
 * would be a 422 rather than a silently missing picture.
 */
export async function saveGallery(_previousState, formData) {
  const weddingId = formData.get("wedding_id");
  const mediaIds = formData.getAll("media_id");
  const heroMediaId = formData.get("hero_media_id");
  const finalMediaId = formData.get("final_media_id");
  const finalSubtitle = (formData.get("final_subtitle") ?? "").trim();

  const token = await requireToken();

  const gallery = await readGallery(weddingId, token);
  if (gallery.error) return { message: gallery.error };

  // "" is what an unselected radio group posts, and the backend expects a UUID
  // or null. The `includes` guard is what stops a stale selection — a photo
  // deleted in another tab — from turning a save into a 422.
  const chosen = (value) => (value && mediaIds.includes(value) ? value : null);

  const { ok, error } = await apiFetch(`/weddings/${weddingId}/sections/gallery`, {
    method: "PUT",
    token,
    body: JSON.stringify({
      content: {
        ...gallery.content,
        media_ids: mediaIds,
        hero_media_id: chosen(heroMediaId),
        final_media_id: chosen(finalMediaId),
        final_subtitle: finalSubtitle || null,
      },
    }),
  });

  if (!ok) return { message: error };

  refresh(weddingId);
  return { ok: true };
}
