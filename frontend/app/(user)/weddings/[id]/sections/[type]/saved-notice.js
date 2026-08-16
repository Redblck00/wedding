/**
 * The one banner every section form needs: what went wrong, or that it saved.
 *
 * Three states, not two. An action can succeed *and* have something to say —
 * `saveSection` returns `ok` with a message when the section was written but
 * the dashboard's copy of the name was not — and colouring that red would be a
 * lie, while dropping it would hide a real inconsistency.
 *
 * `role="alert"` only on the failure: a success announced over a screen reader
 * on every save is noise, an unexplained failure is not.
 */
export default function SavedNotice({ state }) {
  if (!state?.message && !state?.ok) return null;

  if (state.message) {
    return (
      <p
        role={state.ok ? undefined : "alert"}
        className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${
          state.ok ? "border-gold/30 bg-gold/5 text-gold" : "border-rose/30 bg-rose/5 text-rose"
        }`}
      >
        {state.message}
      </p>
    );
  }

  return (
    <p className="rounded-xl border border-sage/30 bg-sage/5 px-4 py-3 text-sm text-sage">
      Хадгалагдлаа.
    </p>
  );
}
