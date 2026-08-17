/**
 * Shrinks a photo in the browser before it is uploaded.
 *
 * A reply to a platform limit, not an optimisation. Photos travel
 * browser -> Server Action -> backend, and a Vercel function caps the request
 * body it will accept at around 4.5MB — below what a phone camera produces, and
 * not something `serverActions.bodySizeLimit` can raise, because the rejection
 * happens in front of the function. Sending the original meant a normal photo
 * failing with no message worth reading.
 *
 * The backend still re-encodes everything it receives. This does not replace
 * that: `media_service.compress_image` is what strips EXIF, and a file that
 * skipped this path entirely — an old browser, a format canvas cannot read —
 * must still arrive clean. What this does is make the upload small enough to
 * arrive at all, and fast enough to matter on mobile data.
 *
 * The targets match `media_service.py` so the two stages agree on the answer
 * and the second one has nothing left to do.
 */

/** Matches `MAX_IMAGE_DIMENSION` in `media_service.py`. */
const MAX_DIMENSION = 2400;

/** Matches `WEBP_QUALITY` (82), on the 0-1 scale `toBlob` uses. */
const QUALITY = 0.82;

/**
 * The largest file the couple may pick, before compression.
 *
 * Matches `MAX_UPLOAD_BYTES` in `media_service.py`. A 20MB original is fine
 * because what leaves the browser is the compressed copy.
 */
export const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
export const MAX_SOURCE_MB = MAX_SOURCE_BYTES / (1024 * 1024);

/**
 * The largest thing allowed to cross the network to a Server Action.
 *
 * Under the platform's own ceiling on purpose, so a file that cannot be
 * compressed — a HEIC that canvas will not decode, most likely — is refused
 * here, with a sentence the couple can act on, rather than by infrastructure
 * that answers with a bare 413. A compressed 2400px photo lands near 400KB, so
 * this only ever binds on the fallback path.
 */
export const MAX_PAYLOAD_BYTES = Math.round(3.5 * 1024 * 1024);

/** Longest edge to `MAX_DIMENSION`, aspect kept. Never enlarges. */
function targetSize(width, height) {
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function toBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * A compressed copy of `file`, or `file` itself when compressing is not
 * possible or not worth it.
 *
 * Never throws: every failure here is a reason to fall back to the original,
 * which the backend can still handle, and none of them is worth turning an
 * upload into an error.
 */
export async function compressImage(file) {
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") {
    return file;
  }

  let bitmap;
  try {
    bitmap = await createImageBitmap(file, {
      // Canvas output carries no EXIF, so the orientation tag has to be applied
      // now or it is lost — and every portrait photo from a phone would arrive
      // sideways with nothing left to say it was.
      imageOrientation: "from-image",
      // A decode hint. Where it is honoured the full-size bitmap never exists,
      // which is what keeps a 45MP photo from taking ~180MB in a phone's tab;
      // where it is ignored the draw below still produces the same result.
      resizeWidth: MAX_DIMENSION,
      resizeHeight: MAX_DIMENSION,
      resizeQuality: "high",
    });
  } catch {
    // HEIC on a browser that cannot decode it lands here, as does anything
    // corrupt. The backend gets the original and decides.
    return file;
  }

  try {
    const { width, height } = targetSize(bitmap.width, bitmap.height);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return file;

    context.drawImage(bitmap, 0, 0, width, height);

    let blob = await toBlob(canvas, "image/webp", QUALITY);

    // Safari before 16 does not encode WebP and quietly answers with PNG
    // instead of refusing — and a PNG of a photograph is larger than the JPEG
    // that went in, which would make this worse than doing nothing. The type of
    // what came back is the only way to tell.
    if (!blob || blob.type !== "image/webp") {
      blob = await toBlob(canvas, "image/jpeg", QUALITY);
    }

    if (!blob) return file;

    // An already-small, already-optimised picture can come out bigger. Keeping
    // whichever is smaller means this can only ever help.
    if (blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + (blob.type === "image/webp" ? ".webp" : ".jpg");
    return new File([blob], name, { type: blob.type, lastModified: Date.now() });
  } catch {
    return file;
  } finally {
    bitmap.close?.();
  }
}
