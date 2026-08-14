"""Rules that outlive any single endpoint: slug allocation, seeding, publishing."""

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import SectionType, UserTemplateStatus
from app.models.template import Template
from app.models.template_content import TemplateContent
from app.models.user_template import UserTemplate
from app.models.wedding import Wedding
from app.models.wedding_section import WeddingSection

# An invitation with no couple and no schedule is not an invitation. Enforced on
# publish regardless of what the template marks as required.
REQUIRED_SECTIONS_FOR_PUBLISH = (
    SectionType.BRIDE_INFO,
    SectionType.GROOM_INFO,
    SectionType.EVENT_SCHEDULE,
)


class WeddingServiceError(ValueError):
    """Domain failure. Routers map this to a 4xx — kept FastAPI-free so the
    service stays testable and reusable from scripts.
    """


def assert_template_usable(db: Session, template_id: uuid.UUID, user_id: uuid.UUID) -> Template:
    """A paid template needs an access grant; a free one does not."""
    template = db.get(Template, template_id)
    if template is None or not template.is_active:
        raise WeddingServiceError("Template not found")

    if template.is_free:
        return template

    grant = db.scalar(
        select(UserTemplate.id).where(
            UserTemplate.user_id == user_id,
            UserTemplate.template_id == template_id,
            UserTemplate.status == UserTemplateStatus.ACTIVE,
        )
    )
    if grant is None:
        raise WeddingServiceError("This template has not been purchased")

    return template


def seed_sections(db: Session, wedding: Wedding) -> list[WeddingSection]:
    """Creates the wedding's sections from its template's definitions.

    Copies `default_content` by value — later edits to the template must not
    reach back into invitations already built from it.
    """
    definitions = db.scalars(
        select(TemplateContent)
        .where(
            TemplateContent.template_id == wedding.template_id,
            TemplateContent.is_enabled.is_(True),
        )
        .order_by(TemplateContent.display_order)
    ).all()

    sections = [
        WeddingSection(
            wedding_id=wedding.id,
            section_type=definition.section_type,
            content=dict(definition.default_content or {}),
            display_order=definition.display_order,
        )
        for definition in definitions
    ]
    db.add_all(sections)
    return sections


def _is_filled(content: dict[str, Any]) -> bool:
    """True once a section holds something a guest could actually read.

    A truthiness test on the dict alone is not enough: a template that ships
    `default_content` — a placeholder schedule, an empty `{"name": ""}` — seeds a
    non-empty dict before the couple has typed anything, and the publish gate
    below would wave it through. So look at the values, not the keys.
    """
    return any(value not in (None, "", [], {}, ()) for value in content.values())


def missing_required_sections(db: Session, wedding: Wedding) -> list[str]:
    """Names of sections that must be filled before publishing but are not.

    An empty list means publishable. Returns names rather than raising so the
    caller picks the HTTP status.
    """
    required: dict[SectionType, str] = {
        section_type: section_type.value for section_type in REQUIRED_SECTIONS_FOR_PUBLISH
    }

    # A template can demand more than the baseline; its display_name is friendlier.
    for definition in db.scalars(
        select(TemplateContent).where(
            TemplateContent.template_id == wedding.template_id,
            TemplateContent.is_required.is_(True),
        )
    ):
        required[definition.section_type] = definition.display_name

    # An untouched section counts as unfilled: seeding creates the row before
    # the couple has typed anything into it.
    filled = {section.section_type for section in wedding.sections if _is_filled(section.content)}

    return [name for section_type, name in required.items() if section_type not in filled]
