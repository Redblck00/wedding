"""Extracts a YouTube video id from whatever the user pasted.

The background-music section stores only the id, so the frontend can build its
own embed URL — storing a full watch URL would mean re-parsing it on render.
"""

import re
from urllib.parse import parse_qs, urlparse

# 11 chars, base64url alphabet — YouTube's id format.
_VIDEO_ID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")

_PATH_PREFIXES = ("/embed/", "/v/", "/shorts/", "/live/")


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


def watch_url(video_id: str) -> str:
    return f"https://www.youtube.com/watch?v={video_id}"
