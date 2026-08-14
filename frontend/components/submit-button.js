export default function SubmitButton({ pending, children, pendingLabel = "Түр хүлээнэ үү…" }) {
  return (
    <button
      type="submit"
      disabled={pending}
      // aria-busy so the wait is announced, not only drawn. On the free tier the
      // backend can be cold-starting, and this button may sit here for a while.
      aria-busy={pending}
      className="min-h-12 w-full rounded-full bg-rose px-6 text-sm font-medium text-ivory transition-colors hover:bg-rose/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
