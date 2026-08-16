"use client";

import { useActionState, useState } from "react";

import { saveSection } from "@/app/actions/sections";
import SubmitButton from "@/components/submit-button";
import SavedNotice from "./saved-notice";

/**
 * The running order of the day.
 *
 * Order is meaningful twice over: the timeline draws the rows top to bottom,
 * and the countdown takes its target time from the *first* entry — the wedding
 * date is a bare DATE with no clock on it. That is why the rows can be moved
 * rather than only added and removed: a forgotten early event would otherwise
 * mean retyping everything after it.
 *
 * `ends_at` exists on the backend's `ScheduleEntry` but this design never
 * prints it, so the form does not ask for it.
 */

let nextRowId = 0;

function toRow(entry) {
  return {
    id: (nextRowId += 1),
    title: entry?.title ?? "",
    // The API stores a time, so it comes back as "17:00:00" — `<input
    // type="time">` only accepts "17:00".
    starts_at: (entry?.starts_at ?? "").slice(0, 5),
    description: entry?.description ?? "",
  };
}

export default function ScheduleForm({ weddingId, sectionType, content }) {
  const [state, formAction, pending] = useActionState(saveSection, undefined);

  const [rows, setRows] = useState(() => {
    const entries = content?.entries ?? [];
    return entries.length > 0 ? entries.map(toRow) : [toRow()];
  });

  const update = (id, field, value) =>
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );

  const move = (index, delta) =>
    setRows((current) => {
      const target = index + delta;
      if (target < 0 || target >= current.length) return current;

      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="wedding_id" value={weddingId} />
      <input type="hidden" name="section_type" value={sectionType} />

      <SavedNotice state={state} />

      <ul className="space-y-4">
        {rows.map((row, index) => (
          <li key={row.id} className="rounded-2xl border border-line bg-white/60 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted">
                {index + 1}-р үйл явдал
                {index === 0 ? (
                  <span className="ml-2 text-xs text-rose">тоолуур эндээс</span>
                ) : null}
              </span>

              <div className="flex gap-1">
                <RowButton
                  label="Дээш"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
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
                  onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}
                >
                  ✕
                </RowButton>
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_9rem]">
              <input
                name="entry_title"
                value={row.title}
                onChange={(event) => update(row.id, "title", event.target.value)}
                placeholder="Ёслолын ажиллагаа"
                maxLength={150}
                aria-label={`${index + 1}-р үйл явдлын нэр`}
                className="min-h-12 w-full rounded-xl border border-line bg-white px-4 text-base outline-none transition-colors placeholder:text-muted/60 focus:border-rose focus:ring-2 focus:ring-rose/30"
              />

              <input
                name="entry_starts_at"
                type="time"
                value={row.starts_at}
                onChange={(event) => update(row.id, "starts_at", event.target.value)}
                aria-label={`${index + 1}-р үйл явдлын цаг`}
                className="min-h-12 w-full rounded-xl border border-line bg-white px-4 text-base outline-none transition-colors focus:border-rose focus:ring-2 focus:ring-rose/30"
              />
            </div>

            <textarea
              name="entry_description"
              rows={2}
              value={row.description}
              onChange={(event) => update(row.id, "description", event.target.value)}
              placeholder="Товч тайлбар (заавал биш)"
              aria-label={`${index + 1}-р үйл явдлын тайлбар`}
              className="mt-3 w-full resize-none rounded-xl border border-line bg-white px-4 py-3 text-base outline-none transition-colors placeholder:text-muted/60 focus:border-rose focus:ring-2 focus:ring-rose/30"
            />
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setRows((current) => [...current, toRow()])}
        className="min-h-12 w-full rounded-full border border-dashed border-line text-sm text-muted transition-colors hover:border-rose/40 hover:text-ink"
      >
        + Үйл явдал нэмэх
      </button>

      <SubmitButton pending={pending} pendingLabel="Хадгалж байна…">
        Хадгалах
      </SubmitButton>
    </form>
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
