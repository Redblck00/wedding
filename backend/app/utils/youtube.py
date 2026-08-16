"""Extracts a YouTube video id — and any start timestamp — from a pasted link.

The background-music section stores only the id and an offset in seconds, so the
frontend can build its own embed URL — storing a full watch URL would mean
re-parsing it on render.
"""

import re
from urllib.parse import parse_qs, urlparse

# 11 chars, base64url alphabet — YouTube's id format.
_VIDEO_ID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")

_PATH_PREFIXES = ("/embed/", "/v/", "/shorts/", "/live/")

# `1h2m3s`, `2m30s`, `45s`, or a bare `45`. YouTube writes the first form in
# share links and accepts all of them.
_TIMESTAMP_RE = re.compile(r"^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$", re.IGNORECASE)

# Matches the ceiling on `BackgroundMusicContent.start_seconds`. `_normalise_music`
# writes the parsed value in after the schema has already run, so anything past
# the bound has to be rejected here or it would be stored unchecked.
MAX_START_SECONDS = 24 * 60 * 60


def extract_video_id(value: str) -> str | None:
    """Accepts a watch/share/embed/shorts URL, or a bare id.

    Returns None when nothing valid is found — callers should treat that as a
    validation error rather than storing the raw string.
    """
    value = value.strip()
    if not value:
        return None

    # Already an id.
    if _VIDEO_ID_RE.match(value):
        return value

    # urlparse needs a scheme to populate netloc, so "youtu.be/x" gets one.
    if "//" not in value:
        value = f"https://{value}"

    parsed = urlparse(value)
    host = parsed.netloc.lower().removeprefix("www.").removeprefix("m.")

    if host == "youtu.be":
        candidate = parsed.path.lstrip("/").split("/")[0]
        return candidate if _VIDEO_ID_RE.match(candidate) else None

    if host not in ("youtube.com", "youtube-nocookie.com"):
        return None

    if parsed.path == "/watch":
        candidate = parse_qs(parsed.query).get("v", [""])[0]
        return candidate if _VIDEO_ID_RE.match(candidate) else None

    for prefix in _PATH_PREFIXES:
        if parsed.path.startswith(prefix):
            candidate = parsed.path[len(prefix) :].split("/")[0]
            return candidate if _VIDEO_ID_RE.match(candidate) else None

    return None


def _parse_timestamp(raw: str) -> int | None:
    """`"1m30s"` / `"90"` -> 90. None when it is not a timestamp at all."""
    raw = raw.strip().lower()
    if not raw:
        return None

    match = _TIMESTAMP_RE.match(raw)
    # Every group is optional, so the pattern also matches an empty string and a
    # stray `"s"` — `any` is what rejects those.
    if match is None or not any(match.groups()):
        return None

    hours, minutes, seconds = (int(group or 0) for group in match.groups())
    total = hours * 3600 + minutes * 60 + seconds

    return total if 0 < total <= MAX_START_SECONDS else None


def extract_start_seconds(value: str) -> int | None:
    """How far into the track a pasted link points, if it says.

    This is what "Copy video URL at current time" adds — `?t=75` on a share
    link, `&t=75s` on a watch URL — and it is the whole reason a couple can pick
    the chorus without counting seconds by hand. Returns None when the link
    carries no timestamp, which callers must treat as "leave it alone" rather
    than as zero: a link pasted a second time, or the bare id the form hands
    back, would otherwise wipe a start the couple had already chosen.
    """
    value = value.strip()
    if not value or _VIDEO_ID_RE.match(value):
        return None

    if "//" not in value:
        value = f"https://{value}"

    parsed = urlparse(value)
    query = parse_qs(parsed.query)

    # `t` is what the share button writes; `start` is the embed parameter, and
    # someone copying an embed URL out of an iframe brings it along. The
    # fragment is the old `#t=` form, still produced by some clients.
    candidates = [
        *query.get("t", []),
        *query.get("start", []),
        *parse_qs(parsed.fragment).get("t", []),
    ]

    for candidate in candidates:
        seconds = _parse_timestamp(candidate)
        if seconds is not None:
            return seconds

    return None


def watch_url(video_id: str) -> str:
    return f"https://www.youtube.com/watch?v={video_id}"
