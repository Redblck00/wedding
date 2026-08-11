from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.api.deps import OwnedWedding, SessionDep
from app.models.enums import SectionType
from app.models.template_content import TemplateContent
from app.models.wedding_section import WeddingSection
from app.schemas.common import ErrorResponse
from app.schemas.section import (
    SectionReorderRequest,
    WeddingSectionRead,
    WeddingSectionUpsert,
)
from app.services import section_service

router = APIRouter(prefix="/weddings", tags=["sections"])


def _ordered_sections(db: SessionDep, wedding_id) -> list[WeddingSection]:
    return list(
        db.scalars(
            select(WeddingSection)
            .where(WeddingSection.wedding_id == wedding_id)
            .order_by(WeddingSection.display_order, WeddingSection.section_type)
        )
    )


@router.get("/{wedding_id}/sections", response_model=list[WeddingSectionRead])
def list_sections(wedding: OwnedWedding, db: SessionDep) -> list[WeddingSection]:
    return _ordered_sections(db, wedding.id)


# Declared before /{section_type}: "reorder" would otherwise be parsed as a
# section_type and rejected as an invalid enum value.
@router.patch("/{wedding_id}/sections/reorder", response_model=list[WeddingSectionRead])
def reorder_sections(
    payload: SectionReorderRequest, wedding: OwnedWedding, db: SessionDep
) -> list[WeddingSection]:
    new_order = {item.section_type: item.display_order for item in payload.items}

    for section in _ordered_sections(db, wedding.id):
        if section.section_type in new_order:
            section.display_order = new_order[section.section_type]

    db.commit()
    return _ordered_sections(db, wedding.id)


@router.put(
    "/{wedding_id}/sections/{section_type}",
    response_model=WeddingSectionRead,
    responses={422: {"model": ErrorResponse}},
)
def upsert_section(
    section_type: SectionType,
    payload: WeddingSectionUpsert,
    wedding: OwnedWedding,
    db: SessionDep,
) -> WeddingSection:
    """Editor autosave. Creates the section if it does not exist yet."""
    try:
        content = section_service.validate_content(section_type, payload.content)
    except section_service.SectionContentError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc

    values = {
        "wedding_id": wedding.id,
        "section_type": section_type,
        "content": content,
    }
    if payload.display_order is not None:
        values["display_order"] = payload.display_order
    if payload.is_visible is not None:
        values["is_visible"] = payload.is_visible

    # ON CONFLICT rather than SELECT-then-INSERT: the editor fires autosaves
    # back to back, and two in flight at once would otherwise collide on the
    # (wedding_id, section_type) unique constraint.
    statement = (
        insert(WeddingSection)
        .values(**values)
        .on_conflict_do_update(
            index_elements=[WeddingSection.wedding_id, WeddingSection.section_type],
            # Only the submitted keys are overwritten; an autosave that omits
            # display_order must not reset it.
            set_={key: value for key, value in values.items() if key not in ("wedding_id", "section_type")},
        )
        .returning(WeddingSection)
    )

    section = db.scalars(statement).one()
    db.commit()
    db.refresh(section)
    return section


@router.delete(
    "/{wedding_id}/sections/{section_type}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={409: {"model": ErrorResponse}},
)
def delete_section(section_type: SectionType, wedding: OwnedWedding, db: SessionDep) -> None:
    section = db.scalar(
        select(WeddingSection).where(
            WeddingSection.wedding_id == wedding.id,
            WeddingSection.section_type == section_type,
        )
    )
    if section is None:
        return  # Idempotent: deleting an absent section is not an error.

    is_required = db.scalar(
        select(TemplateContent.id).where(
            TemplateContent.template_id == wedding.template_id,
            TemplateContent.section_type == section_type,
            TemplateContent.is_required.is_(True),
        )
    )
    if is_required is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Section '{section_type.value}' is required by this template",
        )

    db.delete(section)
    db.commit()
