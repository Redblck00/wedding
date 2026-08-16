"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

import { submitRsvp } from "@/app/actions/rsvp";
import Confetti from "./confetti";
import IntroductionDecorations from "./introduction-decorations";
import Reveal from "./reveal";

const GUEST_COUNTS = [1, 2, 3, 4, 5, 6];

/**
 * The guest's reply form, wired to `POST /v1/wedding/{slug}/rsvp`.
 *
 * `preview` renders the same form but never submits it — the template gallery
 * shows a design to a couple who has not bought it yet, and a stray reply from
 * there would land in some real couple's inbox.
 */
export default function Rsvp({ slug, heading, deadline, askGuestCount, customQuestion, preview }) {
  const [state, formAction] = useActionState(submitRsvp, null);
  const [attending, setAttending] = useState("accept");
  const [dismissed, setDismissed] = useState(false);

  const showSuccess = state?.ok && !dismissed;

  return (
    <section className="relative overflow-hidden bg-[#FFF0F5] px-6 py-32">
      <IntroductionDecorations />

      {/* `z-20` matters more here than anywhere else: this is a form, and an
          input whose underline sits under a petal is one a guest cannot read. */}
      <div className="relative z-20 mx-auto max-w-xl">
        <div className="mb-12 text-center">
          <Reveal>
            <p className="font-invite-serif text-[14px] uppercase tracking-[0.5em] text-[#A77B83]">
              Ирэхээ мэдэгдэнэ үү
            </p>
          </Reveal>

          <Reveal delay={150} className="mt-5">
            <h2 className="font-invite-display italic text-6xl text-[#694951]">RSVP</h2>
          </Reveal>

          <Reveal delay={300} className="mt-5">
            <p className="font-invite-serif text-sm leading-7 text-[#916C74]">
              {heading || "Энэ онцгой өдрийг тантай хамт өнгөрүүлэхийг хүсэж байна."}
            </p>

            {deadline ? (
              <p className="mt-3 font-invite-serif text-[10px] uppercase tracking-[0.3em] text-[#B1848C]">
                {deadline}-ны дотор хариулна уу
              </p>
            ) : null}
          </Reveal>
        </div>

        <form
          action={preview ? undefined : formAction}
          onSubmit={preview ? (event) => event.preventDefault() : undefined}
          className="space-y-7"
        >
          <input type="hidden" name="slug" value={slug ?? ""} />
          <input type="hidden" name="attending" value={attending} />

          <Field label="Таны нэр">
            <input
              required
              name="guest_name"
              defaultValue={state?.values?.guest_name}
              placeholder="Нэрээ бичнэ үү"
              className="mt-3 w-full border-b border-[#CFAAB2] bg-transparent px-1 py-4 text-sm outline-none placeholder:text-[#B99AA1]"
            />
          </Field>

          <Field label="Утас / имэйл">
            <input
              name="guest_contact"
              defaultValue={state?.values?.guest_contact}
              placeholder="Заавал биш"
              className="mt-3 w-full border-b border-[#CFAAB2] bg-transparent px-1 py-4 text-sm outline-none placeholder:text-[#B99AA1]"
            />
          </Field>

          <Field label="Та ирэх үү?">
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Choice
                selected={attending === "accept"}
                onClick={() => setAttending("accept")}
                label="Очих боломжтой"
              />
              <Choice
                selected={attending === "decline"}
                onClick={() => setAttending("decline")}
                label="Харамсалтай нь ирэхгүй"
              />
            </div>
          </Field>

          {/* Hidden rather than removed when declining: the couple asked for a
              headcount from the people who are coming, and the action already
              forces it to zero for a decline. */}
          {askGuestCount && attending === "accept" ? (
            <Field label="Хэдүүлээ ирэх вэ?">
              <select
                name="number_of_guests"
                defaultValue={state?.values?.number_of_guests ?? 1}
                className="mt-3 w-full border-b border-[#CFAAB2] bg-transparent px-1 py-4 text-sm outline-none"
              >
                {GUEST_COUNTS.map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}

          <Field label={customQuestion || "Захиас"}>
            <textarea
              name="message"
              rows={4}
              defaultValue={state?.values?.message}
              placeholder="Хүсвэл хэдэн үг үлдээгээрэй..."
              className="mt-3 w-full resize-none border-b border-[#CFAAB2] bg-transparent px-1 py-4 text-sm outline-none placeholder:text-[#B99AA1]"
            />
          </Field>

          {state?.ok === false && state.message ? (
            <p role="alert" className="text-center text-sm text-[#9F4A55]">
              {state.message}
            </p>
          ) : null}

          {/* The form as one block. Revealing each field in turn would mean a
              guest watching inputs appear under the one they are already
              filling in. */}
          <SubmitButton preview={preview} />
        </form>
      </div>

      <AnimatePresence>
        {showSuccess ? (
          <RsvpSuccess name={state.values?.guest_name} onClose={() => setDismissed(true)} />
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="font-invite-serif text-[12px] uppercase tracking-[0.3em] text-[#916C74]">{label}</span>
      {children}
    </label>
  );
}

function Choice({ selected, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`border px-4 py-4 font-invite-serif text-xs transition ${
        selected ? "border-[#9F727B] bg-[#F2DCE2]" : "border-[#D8B7BE]"
      }`}
    >
      {label}
    </button>
  );
}

function SubmitButton({ preview }) {
  // `useFormStatus` reads the enclosing form's state, so it has to live in a
  // child of the form rather than beside the `useActionState` call.
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || preview}
      className="w-full bg-[#795861] py-5 font-invite-serif text-[10px] uppercase tracking-[0.4em] text-white transition hover:bg-[#694951] disabled:opacity-50"
    >
      {preview ? "Урьдчилсан харах" : pending ? "Илгээж байна…" : "Хариу илгээх"}
    </button>
  );
}

function RsvpSuccess({ name, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#FFF0F5]/95 px-6 backdrop-blur-sm"
    >
      <IntroductionDecorations />

      {/*
        Fires the moment this overlay mounts, which is the moment the backend
        confirmed the reply — so the paper is the answer arriving, not the button
        being pressed. Mounted once and never remounted while the overlay is up,
        so it cannot re-fire under the guest.
      */}
      <Confetti />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.8 }}
        className="relative z-20 max-w-md text-center"
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#CFAAB2] bg-white/60">
          <span className="font-invite-display text-3xl text-[#795861]">♥</span>
        </div>

        <p className="mt-8 font-invite-serif text-[10px] uppercase tracking-[0.5em] text-[#A77B83]">Баярлалаа</p>

        <h3 className="mt-5 font-invite-display text-5xl text-[#694951]">{name || "Эрхэм зочин"}</h3>

        <p className="mt-6 font-invite-serif text-sm leading-7 text-[#916C74]">
          Таны хариу хүлээн авлаа.
          <br />
          Тантай хамт байхыг тэсэн ядан хүлээж байна.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-10 border border-[#B9939B] px-8 py-4 font-invite-serif text-[9px] uppercase tracking-[0.35em] text-[#795861]"
        >
          Үргэлжлүүлэх
        </button>
      </motion.div>
    </motion.div>
  );
}
