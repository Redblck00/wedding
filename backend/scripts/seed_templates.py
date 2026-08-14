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

# Placeholder art — replace with real Cloudinary URLs once the designs exist.
_THUMB = "https://placehold.co/600x900"


def _couple_sections() -> tuple[SectionSpec, ...]:
    """The three sections every design opens with, all required to publish."""
    return (
        SectionSpec(SectionType.BRIDE_INFO, "Сүйт бүсгүйн мэдээлэл", is_required=True),
        SectionSpec(SectionType.GROOM_INFO, "Хүргэний мэдээлэл", is_required=True),
        SectionSpec(SectionType.EVENT_SCHEDULE, "Хөтөлбөр", {"entries": []}, is_required=True),
    )


TEMPLATES: tuple[TemplateSpec, ...] = (
    TemplateSpec(
        name="Сонгодог алт",
        category_slug="classic",
        thumbnail_url=f"{_THUMB}/1a1a1a/d4af37?text=Songodog+Alt",
        preview_url=None,
        price=Decimal("0"),
        is_free=True,
        sections=(
            *_couple_sections(),
            SectionSpec(
                SectionType.WEDDING_STORY,
                "Бидний түүх",
                {"intro": "", "entries": []},
            ),
            SectionSpec(SectionType.VENUE, "Байршил", {"heading": "Хаана болох вэ?"}),
            SectionSpec(SectionType.GALLERY, "Зургийн цомог", {"layout": "grid"}),
            SectionSpec(
                SectionType.RSVP_FORM,
                "Ирэхээ баталгаажуулах",
                {"heading": "Та бидэнтэй хамт байх уу?", "ask_guest_count": True},
            ),
            SectionSpec(
                SectionType.BACKGROUND_MUSIC,
                "Дэвсгэр хөгжим",
                # autoplay stays off: browsers block sound-on autoplay anyway,
                # so a template promising it would just look broken.
                {"autoplay": False, "loop": True},
            ),
            SectionSpec(SectionType.GIFT_INFO, "Бэлгийн мэдээлэл", {"accounts": []}),
            SectionSpec(
                SectionType.DRESS_CODE,
                "Хувцаслалт",
                {"description": "", "colors": ["#d4af37", "#1a1a1a", "#f5f5f0"]},
            ),
        ),
    ),
    TemplateSpec(
        name="Минимал цагаан",
        category_slug="modern",
        thumbnail_url=f"{_THUMB}/ffffff/333333?text=Minimal+Tsagaan",
        preview_url=None,
        price=Decimal("0"),
        is_free=True,
        sections=(
            *_couple_sections(),
            SectionSpec(SectionType.VENUE, "Байршил"),
            SectionSpec(SectionType.GALLERY, "Зургийн цомог", {"layout": "masonry"}),
            SectionSpec(
                SectionType.RSVP_FORM,
                "Ирэхээ баталгаажуулах",
                {"heading": "Ирэхээ мэдэгдэнэ үү", "ask_guest_count": True},
            ),
        ),
    ),
    TemplateSpec(
        name="Цэцэгт навч",
        category_slug="floral",
        thumbnail_url=f"{_THUMB}/f6efe6/8a9a5b?text=Tsetsegt+Navch",
        preview_url=None,
        price=Decimal("29900"),
        is_free=False,
        sections=(
            *_couple_sections(),
            SectionSpec(SectionType.WEDDING_STORY, "Бидний түүх", {"intro": "", "entries": []}),
            SectionSpec(SectionType.VENUE, "Байршил", {"heading": "Хаана болох вэ?"}),
            SectionSpec(SectionType.GALLERY, "Зургийн цомог", {"layout": "carousel"}),
            SectionSpec(SectionType.RSVP_FORM, "Ирэхээ баталгаажуулах", {"ask_guest_count": True}),
            SectionSpec(
                SectionType.DRESS_CODE,
                "Хувцаслалт",
                {"description": "", "colors": ["#8a9a5b", "#f6efe6"]},
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
    # Matched on name: `templates` has no natural key other than its id, and an
    # id would have to be hard-coded here to survive a re-run.
    template = db.scalar(select(Template).where(Template.name == spec.name))
    if template is None:
        template = Template(name=spec.name)
        db.add(template)

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

        db.commit()

    print(f"Seeded {len(CATEGORIES)} categories and {len(TEMPLATES)} templates.")


if __name__ == "__main__":
    main()
