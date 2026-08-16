"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";

import { removeVenuePhoto, saveVenueSection, uploadVenuePhoto } from "@/app/actions/venues";
import FormField from "@/components/form-field";
import SubmitButton from "@/components/submit-button";
import SavedNotice from "./saved-notice";

/**
 * Where the wedding happens.
 *
 * Ceremony and reception are not separate sections — `wedding_sections` is
 * UNIQUE on (wedding_id, section_type), so there is one venue section and many
 * venue rows, shown in the order set here. The first row is also the one the
 * embedded map centres on.
 *
 * Each row carries a photograph. It uploads the moment it is chosen rather than
 * waiting for the save button: a file cannot ride along in this form's submit
 * without pushing the whole screen past the Server Action body limit. The id
 * comes back and travels with the row, so the picture and the address are still
 * committed together.
 */

/** Matches `MAX_UPLOAD_BYTES` in `media_service.py`. Checked here only to fail
 *  fast — the backend's refusal is the real one. */
const MAX_BYTES = 20 * 1024 * 1024;

/** Derived, so the number the couple reads can never drift from the one that is
 *  enforced a line above it. */
const MAX_MB = MAX_BYTES / (1024 * 1024);

let nextRowId = 0;

function toRow(venue) {
  return {
    id: venue?.id ?? "",
    key: (nextRowId += 1),
    name: venue?.name ?? "",
    address: venue?.address ?? "",
    // Stored as a time, so it arrives as "17:00:00" — `<input type="time">`
    // only accepts "17:00".
    starts_at: (venue?.starts_at ?? "").slice(0, 5),
    map_url: venue?.map_url ?? "",
    hasCoordinates: venue?.latitude != null && venue?.longitude != null,
    photo_media_id: venue?.photo_media_id ?? "",
    // Resolved by the page against `wedding.media_assets`; only ever used to
    // draw the thumbnail, never sent back.
    photo_url: venue?.photo_url ?? "",
  };
}

export default function VenueForm({ weddingId, content, venues }) {
  const [state, formAction, pending] = useActionState(saveVenueSection, undefined);

  const [rows, setRows] = useState(() =>
    venues?.length ? venues.map(toRow) : [toRow()],
  );

  const update = (key, field, value) =>
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, [field]: value } : row)),
    );

  const move = (index, delta) =>
    setRows((current) => {
      const target = index + delta;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const [photoError, setPhotoError] = useState(null);
  const [uploadingKey, setUploadingKey] = useState(null);

  async function choosePhoto(row, file) {
    if (!file) return;

    if (file.size > MAX_BYTES) {
      setPhotoError(`«${file.name}» ${MAX_MB} MB-аас том байна.`);
      return;
    }

    setPhotoError(null);
    setUploadingKey(row.key);

    const body = new FormData();
    body.append("wedding_id", weddingId);
    body.append("file", file);

    // Replacing a picture deletes the old one first. Skipping it would leave a
    // file in Cloudinary that nothing points at any more and no screen can
    // reach, so nobody could ever remove it.
    if (row.photo_media_id) await discardPhoto(row, { silent: true });

    const result = await uploadVenuePhoto(null, body);
    setUploadingKey(null);

    if (!result?.ok) {
      setPhotoError(result?.message ?? "Зураг оруулж чадсангүй.");
      return;
    }

    setRows((current) =>
      current.map((item) =>
        item.key === row.key
          ? { ...item, photo_media_id: result.mediaId, photo_url: result.url }
          : item,
      ),
    );
  }

  async function discardPhoto(row, { silent = false } = {}) {
    if (!row.photo_media_id) return;

    const body = new FormData();
    body.append("wedding_id", weddingId);
    body.append("media_id", row.photo_media_id);

    const result = await removeVenuePhoto(null, body);

    if (!result?.ok) {
      if (!silent) setPhotoError(result?.message ?? "Зургийг устгаж чадсангүй.");
      return;
    }

    setRows((current) =>
      current.map((item) =>
        item.key === row.key ? { ...item, photo_media_id: "", photo_url: "" } : item,
      ),
    );
  }

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <input type="hidden" name="wedding_id" value={weddingId} />

      <SavedNotice state={state} />

      <div className="space-y-5">
        <FormField
          label="Гарчиг"
          name="heading"
          maxLength={150}
          placeholder="Хаана болох вэ?"
          defaultValue={content?.heading ?? ""}
        />

        <FormField
          label="Тайлбар"
          name="note"
          maxLength={200}
          placeholder="Бидний хамт байх газрууд"
          defaultValue={content?.note ?? ""}
          hint="Гарчгийн дээр жижгээр харагдана. Заавал биш."
        />
      </div>

      <ul className="space-y-4">
        {rows.map((row, index) => (
          <li key={row.key} className="rounded-2xl border border-line bg-white/60 p-4">
            <input type="hidden" name="venue_id" value={row.id} />

            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted">
                {index + 1}-р байршил
                {index === 0 ? (
                  <span className="ml-2 text-xs text-rose">газрын зураг эндээс</span>
                ) : null}
              </span>

              <div className="flex gap-1">
                <RowButton label="Дээш" disabled={index === 0} onClick={() => move(index, -1)}>
                  ↑
                </RowButton>
                <RowButton
                  label="Доош"
                  disabled={index === rows.length - 1}
                  onClick={() => move(index, 1)}
                >
                  ↓
                </RowButton>
                <RowButton
                  label="Устгах"
                  disabled={rows.length === 1}
                  onClick={() => setRows((current) => current.filter((item) => item.key !== row.key))}
                >
                  ✕
                </RowButton>
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_9rem]">
              <Input
                name="venue_name"
                value={row.name}
                onChange={(value) => update(row.key, "name", value)}
                placeholder="Хуримын ордон"
                maxLength={200}
                ariaLabel={`${index + 1}-р байршлын нэр`}
              />

              <Input
                name="venue_starts_at"
                type="time"
                value={row.starts_at}
                onChange={(value) => update(row.key, "starts_at", value)}
                ariaLabel={`${index + 1}-р байршлын цаг`}
              />
            </div>

            <Input
              className="mt-3"
              name="venue_address"
              value={row.address}
              onChange={(value) => update(row.key, "address", value)}
              placeholder="Улаанбаатар, Сүхбаатар дүүрэг"
              ariaLabel={`${index + 1}-р байршлын хаяг`}
            />

            <Input
              className="mt-3"
              name="venue_map_url"
              type="url"
              inputMode="url"
              value={row.map_url}
              onChange={(value) => update(row.key, "map_url", value)}
              placeholder="https://maps.app.goo.gl/..."
              ariaLabel={`${index + 1}-р байршлын Google Maps холбоос`}
            />

            <p className="mt-2 text-xs text-muted">
              {row.hasCoordinates
                ? "✓ Байршил тодорхойлогдсон — газрын зураг яг таарна."
                : "Google Maps дээрээс «Хуваалцах» товчийн холбоосыг буулгана уу. Байршил олдвол газрын зураг яг тэр цэгийг харуулна."}
            </p>

            {/* Submitted in DOM order alongside the other `venue_*` fields, so
                the action reads it at the same index as the row it belongs to. */}
            <input type="hidden" name="venue_photo_media_id" value={row.photo_media_id} />

            <VenuePhoto
              row={row}
              uploading={uploadingKey === row.key}
              onChoose={(file) => choosePhoto(row, file)}
              onRemove={() => discardPhoto(row)}
            />
          </li>
        ))}
      </ul>

      {photoError ? (
        <p
          role="alert"
          className="rounded-xl border border-rose/30 bg-rose/5 px-4 py-3 text-sm text-rose"
        >
          {photoError}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => setRows((current) => [...current, toRow()])}
        className="min-h-12 w-full rounded-full border border-dashed border-line text-sm text-muted transition-colors hover:border-rose/40 hover:text-ink"
      >
        + Байршил нэмэх
      </button>

      <SubmitButton pending={pending} pendingLabel="Хадгалж байна…">
        Хадгалах
      </SubmitButton>
    </form>
  );
}

/**
 * One venue's picture: a thumbnail once there is one, an invitation to add one
 * while there is not.
 *
 * `aspect-4/5` matches the frame the design draws these in, so what the couple
 * approves here is the crop a guest sees rather than a wider one that loses its
 * edges later.
 */
function VenuePhoto({ row, uploading, onChoose, onRemove }) {
  const input = useRef(null);

  return (
    <div className="mt-3 flex items-center gap-3">
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        onChange={(event) => {
          const [file] = event.target.files;
          // Cleared before the upload is awaited: without it, picking the same
          // file again fires no `change` event and nothing happens.
          event.target.value = "";
          onChoose(file);
        }}
        className="hidden"
      />

      {row.photo_url ? (
        <div className="relative aspect-4/5 w-16 overflow-hidden rounded-lg bg-shell">
          <Image src={row.photo_url} alt="" fill sizes="64px" className="object-cover" />
        </div>
      ) : (
        <div
          aria-hidden
          className="flex aspect-4/5 w-16 items-center justify-center rounded-lg border border-dashed border-line text-xl text-muted/50"
        >
          ❀
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={uploading}
          className="min-h-9 rounded-full border border-line px-4 text-xs text-muted transition-colors hover:border-rose/40 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? "Оруулж байна…" : row.photo_url ? "Зураг солих" : "Зураг нэмэх"}
        </button>

        {row.photo_url ? (
          <button
            type="button"
            onClick={onRemove}
            disabled={uploading}
            className="min-h-9 rounded-full border border-line px-4 text-xs text-muted transition-colors hover:border-rose/40 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            Устгах
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Input({ name, type = "text", value, onChange, placeholder, maxLength, ariaLabel, className = "", inputMode }) {
  return (
    <input
      name={name}
      type={type}
      inputMode={inputMode}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      aria-label={ariaLabel}
      className={`min-h-12 w-full rounded-xl border border-line bg-white px-4 text-base outline-none transition-colors placeholder:text-muted/60 focus:border-rose focus:ring-2 focus:ring-rose/30 ${className}`}
    />
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
