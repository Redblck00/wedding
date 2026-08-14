/**
 * One labelled input with its error message.
 *
 * The error is tied to the input with `aria-describedby` and `aria-invalid`
 * rather than only being shown in red — colour alone does not reach a screen
 * reader, and "нэвтэрч чадахгүй байгаа шалтгаан нь юу вэ" is the worst possible
 * thing to leave unannounced.
 */
export default function FormField({
  label,
  name,
  type = "text",
  error,
  hint,
  defaultValue = "",
  ...props
}) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        // min-h-12 keeps every control above the 44px touch target; text-base
        // stops iOS Safari zooming the page in on focus, which it does for any
        // input under 16px and which guests read as the page jumping.
        className={`mt-1.5 min-h-12 w-full rounded-xl border bg-white px-4 text-base outline-none transition-colors placeholder:text-muted/60 focus:ring-2 focus:ring-rose/30 ${
          error ? "border-rose" : "border-line focus:border-rose"
        }`}
        {...props}
      />

      {error ? (
        <p id={errorId} className="mt-1.5 text-sm text-rose">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
