/**
 * The photographs the home page expects to find in `public/`.
 *
 * Listed here rather than inlined in the markup so adding or swapping a picture
 * is one line in one file. Every path is optional: `components/photo.js` falls
 * back to a tinted placeholder when a file is missing, so the page is never
 * broken-looking while the real photographs are still being chosen.
 *
 * Drop files at exactly these paths (any of .jpg/.jpeg/.png/.webp — just keep
 * the name and update the extension here if it differs).
 */

/** The full-bleed picture behind the opening screen. Portrait crops best. */
export const HERO_PHOTO = "/hurim/_JAK8145.JPG";

/** The strip further down the page. Three reads well on a phone; more is fine. */
export const GALLERY_PHOTOS = [
  { src: "/hurim/_JAK8040.jpg", alt: "Хуримын гэрэл зураг" },
  { src: "/hurim/_JAK8145.jpg", alt: "Хуримын гэрэл зураг" },
  { src: "/hurim/_JAK8081.jpg", alt: "Хуримын гэрэл зураг" },
];

/**
 * Preview images for the invitation designs shown on the landing page.
 *
 * Placeholders until `admin/templates.py` exists and the catalogue can be read
 * from the backend — at which point these come from `GET /v1/templates` and
 * this constant goes away.
 */
export const TEMPLATE_PREVIEWS = [
  {
    src: "/hurim/_JAK8096.jpg",
    name: "Сонгино",
    note: "Цэвэрхэн, цагаан суурьтай",
    accent: "bg-rose-soft",
  },
  {
    src: "/hurim/_JAK8113.jpg",
    name: "Алтан намар",
    note: "Дулаан өнгө, том гарчиг",
    accent: "bg-gold",
  },
  {
    src: "/hurim/_JAK8157.jpg",
    name: "Ногоон хөндий",
    note: "Байгалийн сэдэвтэй",
    accent: "bg-sage",
  },
];
