from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import SessionDep
from app.models.enums import WeddingStatus
from app.models.wedding import Wedding
from app.schemas.common import ErrorResponse
from app.schemas.media import MediaAssetRead
from app.schemas.section import WeddingSectionRead
from app.schemas.venue import VenueRead
from app.schemas.wedding import PublicWeddingRead

# Singular "/wedding" — the guest-facing read side, deliberately a different path
# from the owner's "/weddings" collection.
router = APIRouter(prefix="/wedding", tags=["public"])


@router.get(
    "/{slug}",
    response_model=PublicWeddingRead,
    responses={404: {"model": ErrorResponse}},
)
def read_public_wedding(slug: str, db: SessionDep) -> PublicWeddingRead:
    """PUBLIC — no auth. This response is world-readable, so it is built from
    `PublicWeddingRead`, which carries no `user_id` and no template pricing.
    """
    wedding = db.scalar(
        select(Wedding)
        .where(
            Wedding.slug == slug,
            # 404 rather than 403 for a draft: whether an unpublished invitation
            # exists at a given slug should not be discoverable by guessing.
            Wedding.status == WeddingStatus.PUBLISHED,
        )
        # Without these the page costs one query per section, venue and photo.
        # `template` is loaded for its `code` alone — the design to render.
        .options(
            selectinload(Wedding.template),
            selectinload(Wedding.sections),
            selectinload(Wedding.venues),
            selectinload(Wedding.media_assets),
        )
    )
    if wedding is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")

    visible_sections = sorted(
        (section for section in wedding.sections if section.is_visible),
        key=lambda section: section.display_order,
    )

    return PublicWeddingRead(
        slug=wedding.slug,
        bride_name=wedding.bride_name,
        groom_name=wedding.groom_name,
        wedding_date=wedding.wedding_date,
        theme_color=wedding.theme_color,
        font_family=wedding.font_family,
        template_id=wedding.template_id,
        template_code=wedding.template.code,
        sections=[WeddingSectionRead.model_validate(section) for section in visible_sections],
        venues=[
            VenueRead.model_validate(venue)
            for venue in sorted(wedding.venues, key=lambda venue: venue.display_order)
        ],
        media_assets=[MediaAssetRead.model_validate(asset) for asset in wedding.media_assets],
    )
