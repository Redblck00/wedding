"use server";

import { redirect } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { clearSession, getAccessToken, getRefreshToken, saveSession } from "@/lib/session";
import { hasErrors, validateLogin, validateRegister } from "@/lib/validation";

/**
 * Auth actions.
 *
 * These run on the server, so the password is posted to the backend from here
 * and the tokens are written straight into httpOnly cookies — neither ever
 * reaches the browser's JavaScript.
 *
 * Each returns `{ errors, message, values }` for `useActionState` to render.
 * `values` echoes back what was typed (minus the password) so a rejected form
 * does not make the user retype everything.
 */

/**
 * `redirect()` works by throwing, so it must be called *after* the try/catch
 * around anything, and its error must never be swallowed. Keeping every
 * redirect at the very end of an action is the simplest way to be sure.
 */
/**
 * Where to send someone after signing in.
 *
 * `proxy.js` puts the page they were trying to reach in `?next=`, which means
 * the value reaching this action came from the URL bar and is attacker
 * controlled. Anything that is not a plain in-app path is discarded: allowing
 * `//evil.example` or `https://evil.example` through would turn our own login
 * form into a convincing redirect to someone else's.
 */
function safeDestination(next) {
  if (typeof next !== "string") return "/dashboard";
  if (!next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

export async function login(_previousState, formData) {
  const values = { email: (formData.get("email") ?? "").trim() };
  const password = formData.get("password") ?? "";
  const destination = safeDestination(formData.get("next"));

  const errors = validateLogin({ ...values, password });
  if (hasErrors(errors)) {
    return { errors, values };
  }

  const { ok, data, error } = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: values.email, password }),
  });

  if (!ok) {
    // The backend answers an unknown address and a wrong password identically,
    // on purpose — so this message must stay one message. Splitting it would
    // turn the login form into a way to discover who has an account.
    return { message: error, values };
  }

  await saveSession(data);
  redirect(destination);
}

export async function register(_previousState, formData) {
  const values = {
    full_name: (formData.get("full_name") ?? "").trim(),
    email: (formData.get("email") ?? "").trim(),
    phone: (formData.get("phone") ?? "").trim(),
  };
  const password = formData.get("password") ?? "";

  const errors = validateRegister({ ...values, password });
  if (hasErrors(errors)) {
    return { errors, values };
  }

  const { ok, data, status, error } = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ ...values, password }),
  });

  if (!ok) {
    // 409 is about one field, so it belongs under that field rather than in the
    // form-wide banner where the user has to work out which input to fix.
    if (status === 409) {
      return { errors: { email: "Энэ имэйл хаягаар аль хэдийн бүртгүүлсэн байна." }, values };
    }
    return { message: error, values };
  }

  await saveSession(data);
  redirect("/dashboard");
}

export async function logout() {
  const refreshToken = await getRefreshToken();

  // Tell the backend to revoke the refresh token before dropping the cookies.
  // Skipping this would leave a 30-day token valid in the database, so a copy
  // taken beforehand would still work after the user believed they signed out.
  //
  // The backend requires a live access token here, so a session left idle past
  // the 15-minute window revokes nothing. The cookies still go, which is what
  // the user sees; `proxy.js` refreshing on the way in keeps that window narrow.
  if (refreshToken) {
    await apiFetch("/auth/logout", {
      method: "POST",
      token: await getAccessToken(),
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }

  await clearSession();
  redirect("/");
}
