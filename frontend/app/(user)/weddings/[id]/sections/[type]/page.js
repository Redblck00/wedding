import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/dal";
import { isEditableSection } from "@/lib/sections";
import { getWedding } from "@/lib/weddings";
import GalleryForm from "./gallery-form";
import MusicForm from "./music-form";
import PersonForm from "./person-form";
import RsvpForm from "./rsvp-form";
import ScheduleForm from "./schedule-form";
import StoryForm from "./story-form";
import VenueForm from "./venue-form";

/**
 * The tab title only. Every label rendered on the page itself comes from the
 * template's `contents`, which is the one place a section is named — but
 * `generateMetadata` runs before the wedding is fetched, so it makes do.
 */
const TAB_TITLES = {
  bride_info: "Сүйт бүсгүйн мэдээлэл",
  groom_info: "Хүргэний мэдээлэл",
  event_schedule: "Хөтөлбөр",
  venue: "Байршил",
  gallery: "Зургийн цомог",
  background_music: "Дэвсгэр хөгжим",
  wedding_story: "Бидний түүх",
  rsvp_form: "Ирэхээ баталгаажуулах",
};

export async function generateMetadata({ params }) {
  const { type } = await params;
  return { title: TAB_TITLES[type] ?? "Урилга засах" };
}

/**
 * The album, in display order.
 *
 * Driven by `media_ids` rather than by `media_assets`: the pool holds every
 * file ever uploaded — including a venue's photo and any the couple took back
 * out of the album — while the id list is what the guest page draws. Ids that
 * no longer resolve are dropped instead of rendering as broken tiles.
 */
function galleryPhotos(wedding, content) {
  const byId = new Map((wedding.media_assets ?? []).map((asset) => [asset.id, asset]));

  return (content?.media_ids ?? [])
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((asset) => ({
      id: asset.id,
      url: asset.url,
      thumbnailUrl: asset.thumbnail_url ?? asset.url,
    }));
}

/**
 * Venue rows with their picture resolved to a URL.
 *
 * The row stores `photo_media_id` and nothing else, for the same reason the
 * gallery stores ids: only a `media_assets` row carries the
 * `cloudinary_public_id` that keeps the file deletable. The form needs a URL to
 * draw a thumbnail, so the lookup happens here — the same one the guest page
 * does in `buildInvitation`.
 */
function venuesWithPhotos(wedding) {
  const byId = new Map((wedding.media_assets ?? []).map((asset) => [asset.id, asset]));

  return (wedding.venues ?? []).map((venue) => {
    const asset = byId.get(venue.photo_media_id);

    return {
      ...venue,
      // Empty rather than undefined when the id no longer resolves — a photo
      // deleted elsewhere leaves the row pointing at nothing, and the form
      // should show its placeholder rather than a broken tile.
      photo_url: asset ? (asset.thumbnail_url ?? asset.url) : "",
    };
  });
}

export default async function SectionEditorPage({ params }) {
  await requireUser();

  // `params` is a Promise in Next 16 — synchronous access was removed.
  const { id, type } = await params;

  // A type with no editor yet falls through rather than rendering a blank
  // screen — the overview does not link to those, so arriving here means a
  // typed URL.
  if (!isEditableSection(type)) notFound();

  const { ok, wedding, error } = await getWedding(id);
  if (!ok) {
    if (error) return <ErrorState message={error} weddingId={id} />;
    notFound();
  }

  // The label comes from the template, not from a table in this file — the same
  // `template.contents` the overview lists, so the two can never disagree about
  // what a section is called.
  const definition = (wedding.template?.contents ?? []).find(
    (item) => item.section_type === type,
  );
  if (!definition) notFound();

  const section = wedding.sections.find((item) => item.section_type === type);

  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <Link
        href={`/weddings/${id}`}
        className="text-sm text-muted transition-colors hover:text-ink"
      >
        ← Урилга руу буцах
      </Link>

      <h1 className="mt-6 font-display text-3xl font-light sm:text-4xl">
        {definition.display_name}
      </h1>

      {definition.is_required ? (
        <p className="mt-2 text-sm text-muted">
          Энэ хэсгийг бөглөхгүйгээр урилгаа нийтлэх боломжгүй.
        </p>
      ) : null}

      {HINTS[type] ? <p className="mt-2 text-sm text-muted">{HINTS[type]}</p> : null}

      <div className="mt-10">
        <SectionForm type={type} weddingId={id} wedding={wedding} section={section} />
      </div>
    </div>
  );
}

/**
 * What a section costs beyond its own fields — things the couple cannot see
 * from the form itself.
 */
const HINTS = {
  // The wedding date carries no clock, so the countdown has nowhere else to
  // read the ceremony time from.
  event_schedule: "Эхний үйл явдлын цагаар урилгын тоолуур ажиллана.",
  // The publish gate checks the `venues` rows, not this section's copy, so a
  // couple who fills only the heading is still blocked.
  venue: "Дор хаяж нэг байршил нэмэхгүйгээр урилгаа нийтлэх боломжгүй.",
  gallery: "Нийтлэхэд дор хаяж 3 зураг хэрэгтэй.",
};

/**
 * Picks the editor for a section type.
 *
 * A `switch` returning JSX rather than a `{ type: Component }` lookup: pulling a
 * component out of a map during render is what `react-hooks/static-components`
 * forbids, because React cannot know the identity is stable and would remount
 * the subtree — losing anything half-typed in the form.
 */
function SectionForm({ type, weddingId, wedding, section }) {
  const content = section?.content;

  switch (type) {
    case "gallery":
      // `media_ids` is the display list *and* the order; the photo pool is
      // resolved against it here so the form never has to know that
      // `media_assets` holds files the gallery may not show.
      return (
        <GalleryForm
          weddingId={weddingId}
          photos={galleryPhotos(wedding, content)}
          heroMediaId={content?.hero_media_id}
          finalMediaId={content?.final_media_id}
          finalSubtitle={content?.final_subtitle}
        />
      );

    case "venue":
      // The only editor that also reaches outside `wedding_sections` — the
      // addresses are rows in `venues`, passed in from the same fetch.
      return (
        <VenueForm weddingId={weddingId} content={content} venues={venuesWithPhotos(wedding)} />
      );

    case "event_schedule":
      return <ScheduleForm weddingId={weddingId} sectionType={type} content={content} />;

    case "background_music":
      return <MusicForm weddingId={weddingId} sectionType={type} content={content} />;

    case "wedding_story":
      return <StoryForm weddingId={weddingId} sectionType={type} content={content} />;

    case "rsvp_form":
      return <RsvpForm weddingId={weddingId} sectionType={type} content={content} />;

    default:
      return (
        <PersonForm
          weddingId={weddingId}
          sectionType={type}
          content={content}
          label={type === "groom_info" ? "Хүргэний нэр" : "Сүйт бүсгүйн нэр"}
        />
      );
  }
}

function ErrorState({ message, weddingId }) {
  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-5 py-16 text-center">
      <p
        role="alert"
        className="rounded-xl border border-rose/30 bg-rose/5 px-4 py-3 text-sm text-rose"
      >
        {message}
      </p>
      <Link
        href={`/weddings/${weddingId}`}
        className="mt-6 inline-block text-sm text-muted hover:text-ink"
      >
        ← Урилга руу буцах
      </Link>
    </div>
  );
}
