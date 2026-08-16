"""Fills the template catalogue with a starter set of designs.

`init_db.py` leaves the tables empty, and an empty catalogue makes the whole
editor unreachable: `POST /v1/weddings` requires a `template_id`, and the
wedding's sections are copied from that template's `template_content` rows.

Idempotent — re-running updates rows in place instead of duplicating them,
matched on category slug, template name and section_key. A section dropped from
a spec here is deleted from the catalogue, but weddings already built from it
keep their own copies untouched.

Usage: python -m scripts.seed_templates
"""

import sys
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.enums import SectionType
from app.models.template import Template
from app.models.template_category import TemplateCategory
from app.models.template_content import TemplateContent
from app.services.section_service import validate_content


@dataclass(frozen=True)
class SectionSpec:
    section_type: SectionType
    display_name: str
    # ⚠ Keep this empty-valued for anything `is_required`. A default that
    # already looks filled satisfies the publish gate in `wedding_service`, and
    # the couple ships the template's placeholder text to their guests.
    default_content: dict[str, Any] = field(default_factory=dict)
    is_required: bool = False


@dataclass(frozen=True)
class TemplateSpec:
    # Registry key of the React component that draws this design. It is the
    # template's natural key: the upsert below matches on it, so renaming a
    # template no longer creates a duplicate row.
    code: str
    name: str
    category_slug: str
    thumbnail_url: str
    preview_url: str | None
    price: Decimal
    is_free: bool
    sections: tuple[SectionSpec, ...]


CATEGORIES: tuple[tuple[str, str], ...] = (
    ("Сонгодог", "classic"),
    ("Орчин үеийн", "modern"),
    ("Цэцэгт", "floral"),
)

# Placeholder art — replace with a real Cloudinary URL once the design has been
# photographed. The catalogue links to /templates/{code} for the live preview,
# so this only has to stand in for a thumbnail.
#
# The `.png` matters: placehold.co answers with SVG by default, and `next/image`
# refuses to optimise SVG unless `dangerouslyAllowSVG` is set — because an SVG
# can carry script, and serving one back from our own origin would be stored
# XSS. Asking for a raster keeps that protection on.
_THUMB = "https://placehold.co/600x900"


TEMPLATES: tuple[TemplateSpec, ...] = (
    TemplateSpec(
        code="rose-envelope",
        name="Сарнайн дугтуй",
        category_slug="floral",
        thumbnail_url=f"{_THUMB}/fff0f5/694951.png?text=Rose+Envelope",
        # The catalogue can show the design itself rather than a picture of it.
        preview_url="/templates/rose-envelope",
        price=Decimal("0"),
        is_free=True,
        # Exactly the sections this design draws, in the order the editor should
        # ask for them. A section listed here that the template never renders is
        # worse than a missing one: the couple fills in bank details or a dress
        # code and no guest ever sees them. `gift_info` and `dress_code` are left
        # out for that reason — add them here the day the design grows a panel
        # for each.
        sections=(
            SectionSpec(SectionType.BRIDE_INFO, "Сүйт бүсгүйн мэдээлэл", is_required=True),
            SectionSpec(SectionType.GROOM_INFO, "Хүргэний мэдээлэл", is_required=True),
            SectionSpec(SectionType.WEDDING_STORY, "Бидний түүх", {"intro": "", "entries": []}),
            # Required, and not only because an invitation needs a schedule: the
            # countdown reads its target time from the first entry here, since
            # `weddings.wedding_date` is a bare DATE with no clock on it.
            SectionSpec(SectionType.EVENT_SCHEDULE, "Хөтөлбөр", {"entries": []}, is_required=True),
            SectionSpec(SectionType.VENUE, "Байршил", {"heading": "Хаана болох вэ?"}),
            # No `layout` default: this design lays the photographs out in its
            # own rhythm and ignores the field. Shipping one would put a control
            # in the editor that changes nothing.
            SectionSpec(SectionType.GALLERY, "Зургийн цомог"),
            SectionSpec(
                SectionType.RSVP_FORM,
                "Ирэхээ баталгаажуулах",
                {"heading": "Та бидэнтэй хамт байх уу?", "ask_guest_count": True},
            ),
            SectionSpec(
                SectionType.BACKGROUND_MUSIC,
                "Дэвсгэр хөгжим",
                # Off by default, not because it cannot work — the envelope tap
                # gives this design the user activation browsers require — but
                # because a guest opening an invitation in a meeting should not
                # be ambushed. The couple turns it on knowing that.
                {"autoplay": False, "loop": True},
            ),
        ),
    ),
)


def _upsert_categories(db: Session) -> dict[str, TemplateCategory]:
    by_slug: dict[str, TemplateCategory] = {}

    for name, slug in CATEGORIES:
        category = db.scalar(select(TemplateCategory).where(TemplateCategory.slug == slug))
        if category is None:
            category = TemplateCategory(name=name, slug=slug)
            db.add(category)
        else:
            category.name = name
        by_slug[slug] = category

    return by_slug


def _upsert_template(db: Session, spec: TemplateSpec, category: TemplateCategory) -> Template:
    # Matched on `code`, the one column that is stable across databases and
    # across renames — the id is generated per database and the name is display
    # text an admin may reword.
    template = db.scalar(select(Template).where(Template.code == spec.code))
    if template is None:
        template = Template(code=spec.code)
        db.add(template)

    template.name = spec.name
    template.category = category
    template.thumbnail_url = spec.thumbnail_url
    template.preview_url = spec.preview_url
    template.price = spec.price
    template.is_free = spec.is_free
    template.is_active = True

    _upsert_contents(template, spec.sections)
    return template


def _upsert_contents(template: Template, specs: tuple[SectionSpec, ...]) -> None:
    existing = {row.section_key: row for row in template.contents}
    wanted: set[str] = set()

    for display_order, spec in enumerate(specs):
        # The section type doubles as the stable machine key — one design never
        # ships the same section twice, and UNIQUE (template_id, section_key)
        # enforces that.
        section_key = spec.section_type.value
        wanted.add(section_key)

        # Round-tripping through the section schemas is a check as much as a
        # normalisation: a typo in a default above fails here, at seed time,
        # instead of reaching an editor as a malformed section.
        default_content = validate_content(spec.section_type, dict(spec.default_content))

        row = existing.get(section_key)
        if row is None:
            row = TemplateContent(section_key=section_key, section_type=spec.section_type)
            template.contents.append(row)

        row.display_name = spec.display_name
        row.section_type = spec.section_type
        row.default_content = default_content
        row.display_order = display_order
        row.is_required = spec.is_required
        row.is_enabled = True

    # delete-orphan on the relationship turns this into a DELETE. Only the
    # catalogue entry goes: `seed_sections` copied the content by value, so
    # existing invitations are unaffected.
    for section_key, row in existing.items():
        if section_key not in wanted:
            template.contents.remove(row)


def _deactivate_unlisted(db: Session, live_codes: set[str]) -> list[str]:
    """Hides catalogue rows this file no longer describes.

    Deactivated, never deleted: `weddings.template_id` has no ON DELETE, so a
    DELETE fails the moment one invitation uses the design — and an invitation
    already built on it must keep rendering. `is_active=False` only takes it out
    of the picker.

    Without this, a template dropped from the specs above stays in the catalogue
    forever, pointing at a component the frontend does not ship.
    """
    retired = []

    for template in db.scalars(select(Template).where(Template.is_active.is_(True))):
        if template.code not in live_codes:
            template.is_active = False
            retired.append(template.code)

    return retired


def main() -> None:
    # The template names are Cyrillic and a Windows console defaults to cp1252,
    # which cannot encode them — printing one raises UnicodeEncodeError and
    # aborts the run before the commit.
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    with SessionLocal() as db:
        categories = _upsert_categories(db)

        for spec in TEMPLATES:
            template = _upsert_template(db, spec, categories[spec.category_slug])
            price = "free" if spec.is_free else f"{spec.price:.0f}₮"
            print(f"  - {template.name} ({spec.category_slug}, {price}, {len(spec.sections)} sections)")

        retired = _deactivate_unlisted(db, {spec.code for spec in TEMPLATES})
        for code in retired:
            print(f"  - {code}: deactivated (no longer in the specs above)")

        db.commit()

    print(f"Seeded {len(CATEGORIES)} categories and {len(TEMPLATES)} templates.")


if __name__ == "__main__":
    main()
