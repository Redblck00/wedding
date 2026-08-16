"""Image normalisation before anything reaches Cloudinary.

Re-encoding locally is what actually strips EXIF: Pillow only writes metadata
back out when handed an explicit `exif=` argument, so a plain `save()` drops the
GPS coordinates a phone camera embeds. Cloudinary would keep them on the stored
original, and the original is what `secure_url` points at.

It is also why Cloudinary's free-plan ceiling of 10MB per image never comes into
play. `routers/media.py` uploads `ProcessedImage.data`, never the bytes that came
off the phone — by then the photo is at most 2400px of WebP, well under a
megabyte. `MAX_UPLOAD_BYTES` is a limit on what this process will decode, not on
what the account can store.
"""

from dataclasses import dataclass
from io import BytesIO

from PIL import Image, ImageOps, UnidentifiedImageError
from pillow_heif import register_heif_opener

# Teaches Pillow the HEIC/HEIF formats an iPhone shoots, which it cannot read on
# its own. Registration mutates Pillow's global format registry, so it belongs at
# import time and in the one module that opens uploads — not behind a call some
# future entry point could forget to make.
register_heif_opener()

# Generous enough for a DSLR photo, small enough that a single request cannot
# exhaust memory — the whole body is read before it is inspected.
#
# Raising this costs memory twice over: once for `raw`, and again — far more —
# for the decoded bitmap, which is width × height × 3 bytes whatever the file
# compressed to. Pillow's own decompression-bomb guard (`Image.MAX_IMAGE_PIXELS`,
# ~89MP) is the backstop for the pathological case, not this number.
MAX_UPLOAD_BYTES = 20 * 1024 * 1024

# No invitation renders a photo larger than this; anything bigger is bandwidth
# the couple's guests pay for on mobile data.
MAX_IMAGE_DIMENSION = 2400

# WebP rather than JPEG: at a matched appearance it lands 25-35% smaller, and the
# invitation is opened on a phone on mobile data. Every browser that can run the
# invitation at all has decoded WebP since 2020 (Safari from iOS 14), so there is
# no fallback to keep.
#
# 82 rather than JPEG's 85 because the numbers are not the same scale — WebP's
# quality 82 is around the perceptual quality of JPEG 90.
WEBP_QUALITY = 82

# How hard the encoder searches, 0-6. Measured on a 2400px photo, and the top of
# the range is not worth having:
#
#   RGB   method=4  405K 1.1s   method=6  388K  1.6s
#   RGBA  method=4  335K 1.9s   method=6  320K 43.7s
#
# 4% off the file for 23x the time on an image with an alpha channel — and that
# time is spent in a threadpool worker, holding an upload open. 4 is also
# Pillow's own default; it is named here so a future release cannot quietly
# move it.
WEBP_METHOD = 4

ALLOWED_IMAGE_TYPES = frozenset(
    {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"}
)


class MediaServiceError(ValueError):
    """Rejected upload. Routers map this to a 4xx."""


@dataclass(frozen=True)
class ProcessedImage:
    data: bytes
    width: int
    height: int
    content_type: str = "image/webp"


def compress_image(raw: bytes, content_type: str) -> ProcessedImage:
    """Validates, re-orients, shrinks and re-encodes an uploaded photo."""
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise MediaServiceError(
            f"Unsupported file type {content_type!r}. "
            f"Allowed: {', '.join(sorted(ALLOWED_IMAGE_TYPES))}"
        )

    if len(raw) > MAX_UPLOAD_BYTES:
        raise MediaServiceError(
            f"File is larger than {MAX_UPLOAD_BYTES // (1024 * 1024)} MB"
        )

    try:
        source = Image.open(BytesIO(raw))
    except (UnidentifiedImageError, OSError) as exc:
        # The declared content type is the client's claim, not a fact.
        raise MediaServiceError("File is not a readable image") from exc

    # Decode a JPEG at a fraction of its stored size instead of decoding it whole
    # and shrinking afterwards.
    #
    # This is what makes a 20MB upload affordable. A 46MP photo is 138MB of RGB
    # once decoded, whatever the file compressed to, and that bitmap — not the
    # upload — is what a small instance runs out of room for. `draft` asks
    # libjpeg to scale by a power of two during decoding, so the photo never
    # exists at full size.
    #
    # The target has to be the shape the photo will end up, not the square box
    # it is being fitted into. Pillow derives its power of two from
    # `min(w // target_w, h // target_h)`, so asking for 2400x2400 lets the short
    # side veto the whole reduction: a 4928x3264 photo has 2x of room on its
    # long side, but 3264 // 2400 is 1, and nothing happens. Passing the fitted
    # size instead — 2400x1590 — both axes agree on 2x, and the decode drops from
    # 46MB to 12MB.
    #
    # Safe to do before `exif_transpose` even though that can swap the axes,
    # because the box below is square: a rotated photo fits it the same way.
    # Mode stays `None` so only the size is requested. JPEG is the only format
    # that honours any of this; elsewhere it is a no-op.
    reduction = max(source.width, source.height) / MAX_IMAGE_DIMENSION
    if reduction > 1:
        source.draft(
            None, (round(source.width / reduction), round(source.height / reduction))
        )

    # Apply the EXIF orientation tag *before* the metadata is discarded —
    # otherwise every portrait photo from a phone comes out sideways.
    #
    # A no-op for HEIC, and deliberately still called: pillow-heif rotates during
    # decoding and rewrites the tag to 1, so the pixels arrive upright and this
    # finds nothing to do. JPEG is where it earns its place.
    image = ImageOps.exif_transpose(source)

    if image.mode not in ("RGB", "RGBA"):
        # WebP encodes RGB and RGBA and nothing else, so palette, greyscale and
        # CMYK sources have to be converted. Transparency survives now that the
        # output is not JPEG — a PNG with an alpha channel used to be flattened
        # onto black here.
        transparent = image.mode in ("LA", "PA") or "transparency" in image.info
        image = image.convert("RGBA" if transparent else "RGB")

    image.thumbnail((MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION), Image.Resampling.LANCZOS)

    buffer = BytesIO()
    image.save(buffer, format="WEBP", quality=WEBP_QUALITY, method=WEBP_METHOD)

    return ProcessedImage(data=buffer.getvalue(), width=image.width, height=image.height)
