"""Cloudinary upload/delete wrapper.

Returns `public_id` alongside the URL because that is the only handle
Cloudinary's destroy API accepts — a row that stores just the URL can never have
its file removed, and the account keeps paying for it.
"""

from dataclasses import dataclass

import cloudinary
import cloudinary.uploader
import cloudinary.utils

from app.config import settings

cloudinary.config(
    cloud_name=settings.cloudinary_cloud_name,
    api_key=settings.cloudinary_api_key,
    api_secret=settings.cloudinary_api_secret,
    secure=True,
)

# Cloudinary's own terms: "image" covers jpg/png/webp, "video" also covers audio,
# "raw" is everything else.
RESOURCE_TYPE_IMAGE = "image"
RESOURCE_TYPE_VIDEO = "video"


@dataclass(frozen=True)
class UploadResult:
    url: str
    public_id: str
    resource_type: str
    bytes: int
    width: int | None
    height: int | None
    thumbnail_url: str | None


def upload_file(
    file_bytes: bytes,
    *,
    folder_suffix: str = "",
    resource_type: str = RESOURCE_TYPE_IMAGE,
) -> UploadResult:
    """Uploads bytes and returns everything the `media_assets` row needs.

    `folder_suffix` namespaces the file further inside the configured folder —
    pass the wedding id so one couple's uploads stay grouped.
    """
    folder = settings.cloudinary_folder
    if folder_suffix:
        folder = f"{folder}/{folder_suffix}"

    result = cloudinary.uploader.upload(
        file_bytes,
        folder=folder,
        resource_type=resource_type,
        # Purges any CDN-cached copy when a public_id is overwritten.
        invalidate=True,
    )
    # ⚠ The stored original keeps its EXIF, GPS coordinates included. Cloudinary
    # drops metadata on *derived* assets, so anything served through a
    # transformation URL (build_thumbnail_url, or f_auto/q_auto) is clean — but
    # `secure_url` points at the untouched original. Deliver photos through a
    # transformation, or upload with an eager one, before a phone photo's home
    # address ends up on a public invitation.

    return UploadResult(
        url=result["secure_url"],
        public_id=result["public_id"],
        resource_type=result.get("resource_type", resource_type),
        bytes=result.get("bytes", 0),
        width=result.get("width"),
        height=result.get("height"),
        thumbnail_url=(
            build_thumbnail_url(result["public_id"])
            if result.get("resource_type", resource_type) == RESOURCE_TYPE_IMAGE
            else None
        ),
    )


def build_thumbnail_url(public_id: str, width: int = 400, height: int = 400) -> str:
    """Transformation URL — Cloudinary renders and caches it on first request, so
    no second upload is needed for thumbnails.
    """
    url, _options = cloudinary.utils.cloudinary_url(
        public_id,
        width=width,
        height=height,
        crop="fill",
        quality="auto",
        fetch_format="auto",
        secure=True,
    )
    return url


def delete_file(public_id: str, resource_type: str = RESOURCE_TYPE_IMAGE) -> bool:
    """Returns True when the asset is gone from Cloudinary.

    Cloudinary answers `{"result": "not found"}` rather than raising for an
    already-deleted id, which is treated as success — the goal is "the file is
    not there", and retrying a partial delete should not fail.
    """
    result = cloudinary.uploader.destroy(public_id, resource_type=resource_type, invalidate=True)
    return result.get("result") in ("ok", "not found")
