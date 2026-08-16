"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { deletePhoto, saveGallery, uploadPhoto } from "@/app/actions/gallery";
import FormField from "@/components/form-field";
import SubmitButton from "@/components/submit-button";

/** Matches `MAX_UPLOAD_BYTES` in `media_service.py`. Checked here only to fail
 *  fast — the backend's refusal is the real one. */
const MAX_BYTES = 20 * 1024 * 1024;

/** Derived, so the number the couple reads can never drift from the one that is
 *  enforced a line above it. */
const MAX_MB = MAX_BYTES / (1024 * 1024);
const MIN_PHOTOS = 3;

/**
 * What to tell the couple after a batch of uploads.
 *
 * Null when everything worked — a success line for something they can already
 * see appear on the page is noise.
 */
function summarise(attempted, uploaded, failures) {
  if (failures.length === 0) return null;

  const names = failures.map((failure) => `«${failure.name}»`).join(", ");

  // One file, one reason: say the reason. Several, and the reasons are usually
  // the same one repeated, so the useful facts are how many got through and
  // which ones did not.
  if (failures.length === 1) {
    return attempted === 1
      ? `${names} орсонгүй — ${failures[0].reason}`
      : `${attempted} зургаас ${uploaded} нь орлоо. ${names} орсонгүй — ${failures[0].reason}`;
  }

  return `${attempted} зургаас ${uploaded} нь орлоо. Орсонгүй: ${names}. Дахин оролдоно уу.`;
}

export default function GalleryForm({ weddingId, photos, heroMediaId, finalMediaId, finalSubtitle }) {
  const router = useRouter();
  const fileInput = useRef(null);

  const [order, setOrder] = useState(photos);
  const [hero, setHero] = useState(heroMediaId ?? "");
  const [final, setFinal] = useState(finalMediaId ?? "");
  const [message, setMessage] = useState(null);
  const [saved, setSaved] = useState(false);
  const [busy, startTransition] = useTransition();
  const [uploading, setUploading] = useState(0);

  // Re-seed from the server after an upload or a delete. React's documented way
  // to reset state when a prop changes — a `key` on the parent would work too
  // but would also throw away the file input and any in-flight upload.
  const incoming = photos.map((photo) => photo.id).join();
  const [seen, setSeen] = useState(incoming);
  if (incoming !== seen) {
    setSeen(incoming);
    setOrder(photos);
    setHero(heroMediaId ?? "");
    setFinal(finalMediaId ?? "");
  }

  async function handleFiles(event) {
    const files = [...event.target.files];
    event.target.value = "";
    if (files.length === 0) return;

    setMessage(null);
    setSaved(false);

    /*
     * Collected rather than shown as they happen.
     *
     * Every failure used to go straight into `setMessage`, which meant the last
     * one silently overwrote the others — and if only the final photo of a batch
     * failed, the couple watched several photographs appear and then read
     * "could not connect", with nothing saying which file it was about or that
     * the rest had worked. One summary at the end, naming the files, is the
     * whole difference between a confusing message and an actionable one.
     */
    const failures = [];
    let uploaded = 0;

    for (const [index, file] of files.entries()) {
      if (file.size > MAX_BYTES) {
        failures.push({ name: file.name, reason: `${MAX_MB} MB-аас том байна` });
        continue;
      }

      // Sequential, not Promise.all: each upload is its own request so it stays
      // under the action body limit, and a phone on mobile data does not have
      // to hold several large uploads open at once.
      setUploading(files.length - index);

      const body = new FormData();
      body.append("wedding_id", weddingId);
      body.append("file", file);

      const result = await uploadPhoto(null, body);

      if (result?.ok) uploaded += 1;
      else failures.push({ name: file.name, reason: result?.message ?? "Тодорхойгүй алдаа" });
    }

    setUploading(0);
    setMessage(summarise(files.length, uploaded, failures));
    startTransition(() => router.refresh());
  }

  function remove(mediaId) {
    setMessage(null);
    setSaved(false);

    startTransition(async () => {
      const body = new FormData();
      body.append("wedding_id", weddingId);
      body.append("media_id", mediaId);

      const result = await deletePhoto(null, body);
      if (result?.message) setMessage(result.message);
      router.refresh();
    });
  }

  function move(index, delta) {
    const target = index + delta;
    if (target < 0 || target >= order.length) return;

    setSaved(false);
    setOrder((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSave(formData) {
    setMessage(null);
    const result = await saveGallery(null, formData);
    if (result?.message) setMessage(result.message);
    setSaved(Boolean(result?.ok));
  }

  const short = MIN_PHOTOS - order.length;

  return (
    <div className="space-y-6">
      {message ? (
        <p
          role="alert"
          className="rounded-xl border border-rose/30 bg-rose/5 px-4 py-3 text-sm text-rose"
        >
          {message}
        </p>
      ) : null}

      <div className="rounded-2xl border border-line bg-white/60 p-5">
        <p className="text-sm">
          {order.length} зураг
          {short > 0 ? (
            <span className="text-muted"> · нийтлэхэд дахин {short} хэрэгтэй</span>
          ) : (
            <span className="text-sage"> · нийтлэхэд хангалттай</span>
          )}
        </p>

        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          onChange={handleFiles}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={uploading > 0 || busy}
          className="mt-4 min-h-12 w-full rounded-full border border-dashed border-line text-sm text-muted transition-colors hover:border-rose/40 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading > 0 ? `Оруулж байна… (${uploading} үлдсэн)` : "+ Зураг оруулах"}
        </button>

        <p className="mt-2 text-xs text-muted">
          JPEG, PNG, WebP, HEIC · нэг зураг {MAX_MB} MB хүртэл
        </p>
      </div>

      {order.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line px-5 py-10 text-center text-sm text-muted">
          Зураг хараахан алга байна.
        </p>
      ) : (
        <form action={handleSave} className="space-y-5">
          <input type="hidden" name="wedding_id" value={weddingId} />

          <ul className="grid gap-3 sm:grid-cols-2">
            {order.map((photo, index) => (
              <li
                key={photo.id}
                className="overflow-hidden rounded-2xl border border-line bg-white/60"
              >
                {/* Submitted in DOM order — this list *is* `media_ids`. */}
                <input type="hidden" name="media_id" value={photo.id} />

                <div className="relative aspect-4/3 bg-shell">
                  <Image
                    src={photo.thumbnailUrl ?? photo.url}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover"
                  />
                  <span className="absolute left-2 top-2 rounded-full bg-ink/70 px-2 py-0.5 text-xs text-ivory">
                    {index + 1}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                  {/* Two independent radio groups, so the same photograph may be
                      both — a couple with three pictures should not have to
                      choose which screen goes without one. */}
                  <div className="flex flex-col gap-1.5">
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
                      <input
                        type="radio"
                        name="hero_media_id"
                        value={photo.id}
                        checked={hero === photo.id}
                        onChange={() => {
                          setHero(photo.id);
                          setSaved(false);
                        }}
                      />
                      Нүүр зураг
                    </label>

                    <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
                      <input
                        type="radio"
                        name="final_media_id"
                        value={photo.id}
                        checked={final === photo.id}
                        onChange={() => {
                          setFinal(photo.id);
                          setSaved(false);
                        }}
                      />
                      Төгсгөлийн зураг
                    </label>
                  </div>

                  <div className="flex gap-1">
                    <RowButton label="Зүүн" disabled={index === 0} onClick={() => move(index, -1)}>
                      ←
                    </RowButton>
                    <RowButton
                      label="Баруун"
                      disabled={index === order.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      →
                    </RowButton>
                    <RowButton label="Устгах" disabled={busy} onClick={() => remove(photo.id)}>
                      ✕
                    </RowButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <p className="rounded-xl border border-line bg-white/40 px-4 py-3 text-xs text-muted">
            <strong className="font-medium text-ink">Нүүр зураг</strong> нь урилга нээгдэх
            эхний дэлгэцийн ард бүтэн харагдана. Сонгоогүй бол эхний зураг автоматаар авагдана.
          </p>

          <FormField
            label="Төгсгөлийн бичиг"
            name="final_subtitle"
            maxLength={120}
            placeholder="Мөнхийн эхлэл"
            defaultValue={finalSubtitle ?? ""}
            hint="Сонгосон зурган дээр жижгээр харагдана. Заавал биш."
          />

          {saved ? (
            <p className="rounded-xl border border-sage/30 bg-sage/5 px-4 py-3 text-sm text-sage">
              Хадгалагдлаа.
            </p>
          ) : null}

          <SubmitButton pending={busy} pendingLabel="Хадгалж байна…">
            Дараалал, сонголтыг хадгалах
          </SubmitButton>
        </form>
      )}
    </div>
  );
}

function RowButton({ label, disabled, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-sm text-muted transition-colors hover:border-rose/40 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
