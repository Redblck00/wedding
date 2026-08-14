import { logout } from "@/app/actions/auth";

/**
 * A form rather than an onClick handler: signing out is a state change, so it
 * belongs behind a POST. It also keeps working before the page has hydrated,
 * which on a slow phone is a real window.
 */
export default function LogoutButton({ className = "" }) {
  return (
    <form action={logout}>
      <button
        type="submit"
        className={`min-h-10 rounded-full border border-line px-4 text-sm text-muted transition-colors hover:bg-shell hover:text-ink ${className}`}
      >
        Гарах
      </button>
    </form>
  );
}
