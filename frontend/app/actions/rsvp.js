"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/session";

/**
 * A guest's reply, posted from the public invitation.
 *
 * Runs on the server because `API_BASE_URL` is deliberately not `NEXT_PUBLIC_`
 * — the backend host stays out of the browser bundle, and the guest's browser
 * never talks to the API directly.
 *
 * The slug arrives in the form body rather than from a session: this is the one
 * form on the site with no logged-in user behind it. That is safe here because
 * `POST /wedding/{slug}/rsvp` is public by design and scoped to the invitation
 * named in its own path — a forged slug can only file a reply against another
 * public invitation, which is what typing that URL would do anyway.
 *
 * Returns `{ ok, message, values }` for `useActionState`.
 */
export async function submitRsvp(_previousState, formData) {
  const slug = formData.get("slug");

  const values = {
    guest_name: (formData.get("guest_name") ?? "").trim(),
    guest_contact: (formData.get("guest_contact") ?? "").trim(),
    // Radio/button state arrives as a string; the backend wants a real boolean.
    attending: formData.get("attending") !== "decline",
    number_of_guests: Number(formData.get("number_of_guests") ?? 1),
    message: (formData.get("message") ?? "").trim(),
  };

  if (!values.guest_name) {
    return { ok: false, message: "Нэрээ оруулна уу.", values };
  }

  if (typeof slug !== "string" || !slug) {
    return { ok: false, message: "Урилга олдсонгүй.", values };
  }

  // A guest who declines is not bringing anyone. Sending the picker's leftover
  // count would inflate the couple's headcount with people who said no.
  const numberOfGuests = values.attending
    ? Math.min(Math.max(values.number_of_guests || 1, 1), 50)
    : 0;

  const { ok, status, error } = await apiFetch(`/wedding/${encodeURIComponent(slug)}/rsvp`, {
    method: "POST",
    body: JSON.stringify({
      guest_name: values.guest_name,
      guest_contact: values.guest_contact || null,
      attending: values.attending,
      number_of_guests: numberOfGuests,
      message: values.message || null,
    }),
  });

  if (!ok) {
    // 429 is the burst limit, which a guest hits by double-tapping. Their reply
    // is almost certainly already recorded, so the honest answer is neither an
    // error nor a fresh confirmation.
    if (status === 429) {
      return {
        ok: false,
        message: "Хэт олон удаа илгээлээ. Хариу тань бүртгэгдсэн байж магадгүй.",
        values,
      };
    }
    return { ok: false, message: error, values };
  }

  // 200 rather than 201 means the backend matched this against a reply sent in
  // the last few minutes and returned that one. From the guest's side both mean
  // "we have your answer", so both are a success here.
  return { ok: true, values };
}

/**
 * Removes one reply from the couple's inbox.
 *
 * The submit endpoint above is open to anyone with the link, so the inbox will
 * eventually collect a test entry, a duplicate the guard did not catch, or
 * outright spam. This is the couple's only way to take one back out.
 *
 * Deleted for good rather than hidden: a reply is a name and a phone number
 * somebody handed over, and keeping a copy the couple believes they have
 * removed is the wrong way to hold it. The backend does the same.
 */
export async function deleteRsvp(_previousState, formData) {
  const weddingId = formData.get("wedding_id");
  const rsvpId = formData.get("rsvp_id");

  const token = await getAccessToken();
  if (!token) redirect("/login?next=/dashboard");

  const { ok, error } = await apiFetch(`/weddings/${weddingId}/rsvps/${rsvpId}`, {
    method: "DELETE",
    token,
  });

  if (!ok) return { message: error };

  revalidatePath(`/weddings/${weddingId}/rsvps`);
  return { ok: true };
}
