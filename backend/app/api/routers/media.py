import uuid

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import OwnedWedding, SessionDep
from app.models.enums import MediaType, SectionType
from app.models.media_asset import MediaAsset
from app.models.wedding_section import WeddingSection
from app.schemas.common import ErrorResponse
from app.schemas.media import MediaAssetRead
from app.services import media_service
from app.utils import storage_client

router = APIRouter(prefix="/weddings", tags=["media"])


def _detach_from_galleries(db: Session, wedding_id: uuid.UUID, media_id: uuid.UUID) -> None:
    """Drops a deleted asset out of the gallery it was displayed in.

    Three references have to go, not one. `content.media_ids` is the source of
    truth for what a gallery shows, so a dangling id there renders a broken
    image even though the row is gone. `content.final_media_id` and
    `content.hero_media_id` name the photos a design's closing panel and opening
    screen use, and a dangling id in either leaves the section failing its own
    validator on the couple's next save.
    """
    gallery = db.scalar(
        select(WeddingSection).where(
            WeddingSection.wedding_id == wedding_id,
            WeddingSection.section_type == SectionType.GALLERY,
        )
    )
    if gallery is None:
        return

    content = gallery.content
    updated = dict(content)

    media_ids = content.get("media_ids") or []
    updated["media_ids"] = [value for value in media_ids if value != str(media_id)]

    # Checked independently of the list above. The two can disagree — a photo
    # removed from the gallery but still named as the final or opening one — and
    # returning early on an unchanged `media_ids` would strand it.
    for key in ("final_media_id", "hero_media_id"):
        if content.get(key) == str(media_id):
            updated[key] = None

    if updated == content:
        return

    # Reassign rather than mutate: SQLAlchemy does not detect in-place changes to
    # a JSONB dict, so an edit made in place would never be written back.
    gallery.content = updated


@router.post(
    "/{wedding_id}/media",
    response_model=MediaAssetRead,
    status_code=status.HTTP_201_CREATED,
    responses={413: {"model": ErrorResponse}, 422: {"model": ErrorResponse}},
)
def upload_media(
    wedding: OwnedWedding,
    db: SessionDep,
    file: UploadFile = File(...),
    section_id: uuid.UUID | None = Form(default=None),
) -> MediaAsset:
    """Uploads one photo.

    Declared `def`, not `async def`: the handler runs sync SQLAlchemy, so FastAPI
    dispatches it to a threadpool. An `async def` here would block the event loop
    on every database call.

    TODO: enforce the plan's `storage_limit_mb` by summing this user's existing
    `media_assets.file_size_bytes` — meaningless until subscriptions exist.
    """
    if file.size is not None and file.size > media_service.MAX_UPLOAD_BYTES:
        # Checked before reading so an oversized body is refused without being
        # pulled into memory first.
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File is larger than {media_service.MAX_UPLOAD_BYTES // (1024 * 1024)} MB",
        )

    try:
        processed = media_service.compress_image(
            file.file.read(), file.content_type or "application/octet-stream"
        )
    except media_service.MediaServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc

    if section_id is not None:
        # Scoped to this wedding so a caller cannot attach a photo to somebody
        # else's section by passing its id.
        owns_section = db.scalar(
            select(WeddingSection.id).where(
                WeddingSection.id == section_id,
                WeddingSection.wedding_id == wedding.id,
            )
        )
        if owns_section is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Section not found"
            )

    upload = storage_client.upload_file(
        processed.data,
        folder_suffix=str(wedding.id),
        resource_type=storage_client.RESOURCE_TYPE_IMAGE,
    )

    asset = MediaAsset(
        wedding_id=wedding.id,
        section_id=section_id,
        type=MediaType.IMAGE,
        url=upload.url,
        thumbnail_url=upload.thumbnail_url,
        cloudinary_public_id=upload.public_id,
        file_size_bytes=upload.bytes or len(processed.data),
        width=upload.width or processed.width,
        height=upload.height or processed.height,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


@router.get("/{wedding_id}/media", response_model=list[MediaAssetRead])
def list_media(wedding: OwnedWedding, db: SessionDep) -> list[MediaAsset]:
    return list(
        db.scalars(
            select(MediaAsset)
            .where(MediaAsset.wedding_id == wedding.id)
            .order_by(MediaAsset.uploaded_at.desc())
        )
    )


@router.delete(
    "/{wedding_id}/media/{media_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={404: {"model": ErrorResponse}, 502: {"model": ErrorResponse}},
)
def delete_media(media_id: uuid.UUID, wedding: OwnedWedding, db: SessionDep) -> None:
    asset = db.scalar(
        select(MediaAsset).where(
            MediaAsset.id == media_id, MediaAsset.wedding_id == wedding.id
        )
    )
    if asset is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found")

    # Cloudinary first: the row holds the only copy of the public_id, so deleting
    # it before the remote call succeeds would strand the file in storage with no
    # way left to address it.
    if asset.cloudinary_public_id:
        try:
            destroyed = storage_client.delete_file(asset.cloudinary_public_id)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Could not reach the storage provider — nothing was deleted",
            ) from exc

        if not destroyed:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Storage provider refused the delete — nothing was deleted",
            )

    _detach_from_galleries(db, wedding.id, media_id)
    db.delete(asset)
    db.commit()
