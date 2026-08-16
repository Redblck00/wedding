"""Validation for the schemaless `wedding_sections.content` column.

Postgres will accept any JSON there, so this module is the only thing standing
between the editor's autosave and malformed data.
"""

from typing import Any

from pydantic import ValidationError

from app.models.enums import SectionType
from app.schemas.section import SECTION_CONTENT_SCHEMAS
from app.utils.youtube import extract_start_seconds, extract_video_id


class SectionContentError(ValueError):
    """Raised when a body does not fit its section type. Routers translate this
    into a 422 — kept as a plain exception so the service has no FastAPI import.
    """


def validate_content(section_type: SectionType, content: dict[str, Any]) -> dict[str, Any]:
    """Returns the normalised content ready to store in JSONB.

    `mode="json"` is what makes the result storable: it turns `date`, `time` and
    `UUID` values into strings, which the raw dict would not be — psycopg cannot
    adapt those into jsonb.
    """
    schema = SECTION_CONTENT_SCHEMAS.get(section_type)
    if schema is None:
        return content

    try:
        validated = schema.model_validate(content)
    except ValidationError as exc:
        raise SectionContentError(str(exc)) from exc

    normalised = validated.model_dump(mode="json")

    if section_type is SectionType.BACKGROUND_MUSIC:
        normalised = _normalise_music(normalised)

    return normalised


def _normalise_music(content: dict[str, Any]) -> dict[str, Any]:
    """Accepts a pasted YouTube URL in `youtube_video_id` and stores the bare id.

    Users paste whatever the share button gave them; storing the raw URL would
    push the parsing onto every render.
    """
    raw = content.get("youtube_video_id")
    if not raw:
        return content

    video_id = extract_video_id(raw)
    if video_id is None:
        raise SectionContentError(f"Could not read a YouTube video id from {raw!r}")

    content["youtube_video_id"] = video_id

    # A timestamp on the link overrides the field beside it. Pasting the output
    # of "Copy video URL at current time" is a deliberate act and the more
    # specific of the two — while a link without one says nothing about where
    # the track should start, so the field's own value stands.
    start = extract_start_seconds(raw)
    if start is not None:
        content["start_seconds"] = start

    return content
