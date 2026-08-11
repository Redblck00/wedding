"""Image normalisation before anything reaches Cloudinary.

Re-encoding locally is what actually strips EXIF: Pillow only writes metadata
back out when handed an explicit `exif=` argument, so a plain `save()` drops the
GPS coordinates a phone camera embeds. Cloudinary would keep them on the stored
original, and the original is what `secure_url` points at.
"""

from dataclasses import dataclass
from io import BytesIO

from PIL import Image, ImageOps, UnidentifiedImageError

# Generous enough for a DSLR photo, small enough that a single request cannot
# exhaust memory — the whole body is read before it is inspected.
MAX_UPLOAD_BYTES = 15 * 1024 * 1024

# No invitation renders a photo larger than this; anything bigger is bandwidth
# the couple's guests pay for on mobile data.
MAX_IMAGE_DIMENSION = 2400
JPEG_QUALITY = 85

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
    content_type: str = "image/jpeg"


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

    # Apply the EXIF orientation tag *before* the metadata is discarded —
    # otherwise every portrait photo from a phone comes out sideways.
    image = ImageOps.exif_transpose(source)

    if image.mode != "RGB":
        # JPEG has no alpha channel; a PNG with transparency fails to save
        # without this.
        image = image.convert("RGB")

    image.thumbnail((MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION), Image.Resampling.LANCZOS)

    buffer = BytesIO()
    image.save(buffer, format="JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)

    return ProcessedImage(data=buffer.getvalue(), width=image.width, height=image.height)
