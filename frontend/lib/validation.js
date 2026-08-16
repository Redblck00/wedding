/**
 * Form validation, hand-rolled rather than pulled from a schema library.
 *
 * The backend already validates authoritatively and returns a readable
 * `detail`, so everything here exists only to save a round trip and to put the
 * message next to the field it belongs to. Rules are kept in step with
 * `app/schemas/auth.py`; where they disagree, the backend wins and its 422 is
 * what the user ends up seeing.
 */

/** Matches bcrypt's 72-*byte* ceiling, which the backend enforces. */
const PASSWORD_MAX_BYTES = 72;

export const FIELD_LIMITS = {
  passwordMin: 8,
  fullNameMax: 255,
  phoneMin: 6,
  phoneMax: 20,
};

function isEmail(value) {
  // Deliberately loose. A tighter regex rejects addresses that are actually
  // valid; the backend's email-validator is the real check.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateLogin({ email, password }) {
  const errors = {};

  if (!email) errors.email = "Имэйл хаягаа оруулна уу.";
  else if (!isEmail(email)) errors.email = "Имэйл хаяг буруу байна.";

  if (!password) errors.password = "Нууц үгээ оруулна уу.";

  return errors;
}

export function validateRegister({ full_name, email, phone, password }) {
  const errors = validateLogin({ email, password });

  if (!full_name) errors.full_name = "Нэрээ оруулна уу.";
  else if (full_name.length > FIELD_LIMITS.fullNameMax) {
    errors.full_name = `Нэр ${FIELD_LIMITS.fullNameMax} тэмдэгтээс урт байж болохгүй.`;
  }

  if (!phone) errors.phone = "Утасны дугаараа оруулна уу.";
  else if (phone.length < FIELD_LIMITS.phoneMin || phone.length > FIELD_LIMITS.phoneMax) {
    errors.phone = `Утасны дугаар ${FIELD_LIMITS.phoneMin}-${FIELD_LIMITS.phoneMax} тэмдэгт байх ёстой.`;
  }

  if (password && !errors.password) {
    if (password.length < FIELD_LIMITS.passwordMin) {
      errors.password = `Нууц үг дор хаяж ${FIELD_LIMITS.passwordMin} тэмдэгт байх ёстой.`;
    } else if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) {
      // Counted in bytes, not characters: a Cyrillic password reaches bcrypt's
      // limit at roughly 36 characters, and the backend rejects rather than
      // silently truncating.
      errors.password = "Нууц үг хэт урт байна. Кирилл үсэг 2 тэмдэгт орчим тооцогддог.";
    }
  }

  return errors;
}

/**
 * Kept in step with `SLUG_PATTERN` in `app/schemas/wedding.py`. The cap is 60
 * rather than the column's 150 because this string is printed on the card and
 * encoded in the QR, and both get worse as it grows.
 */
export const SLUG_LIMITS = { min: 3, max: 60 };
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateWeddingCreate({ slug, bride_name, groom_name }) {
  const errors = {};

  if (!slug) {
    errors.slug = "Хаягаа оруулна уу.";
  } else if (slug.length < SLUG_LIMITS.min || slug.length > SLUG_LIMITS.max) {
    errors.slug = `Хаяг ${SLUG_LIMITS.min}-${SLUG_LIMITS.max} тэмдэгт байх ёстой.`;
  } else if (!SLUG_PATTERN.test(slug)) {
    // Spelled out rather than shown as a regex: the couple picks this, sees it
    // before it is printed, and has to understand why their Cyrillic was
    // refused.
    errors.slug =
      "Зөвхөн латин жижиг үсэг, тоо, дундуур зураас. Эхэнд, төгсгөлд зураас байж болохгүй.";
  }

  if (!bride_name) errors.bride_name = "Сүйт бүсгүйн нэрийг оруулна уу.";
  if (!groom_name) errors.groom_name = "Хүргэний нэрийг оруулна уу.";

  return errors;
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}
