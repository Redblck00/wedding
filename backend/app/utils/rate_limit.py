"""Sliding-window request counter, held in this process's memory.

Exists for the one endpoint anyone on the internet can POST to. Deliberately not
Redis: the deployment is a single uvicorn process today and an in-process dict
costs nothing to run. The moment there is more than one worker, each gets its
own counter and the effective limit becomes `workers x limit` — that is the
point to reimplement `check()` over a Redis INCR + EXPIRE, keeping this
signature so no caller changes.

No FastAPI here on purpose; the HTTP side (client address, 429, Retry-After)
lives in `api/deps.py`.
"""

import time
from collections import deque
from threading import Lock

# key -> the moments each recorded hit stops counting, soonest first.
#
# Storing *expiry* rather than hit time is what keeps this window-agnostic: one
# `now` comparison prunes any key, whatever window its caller used. It assumes a
# given key is always checked with the same window — otherwise the deque stops
# being sorted and pruning would miss entries. One key belongs to one limit.
_HITS: dict[str, deque[float]] = {}

# Sync (`def`) endpoints run in a threadpool, so two requests really can be in
# here at once. Without the lock the read-modify-write below is a race and the
# limit leaks under exactly the load it exists to survive.
_LOCK = Lock()

# A public endpoint sees an unbounded number of distinct addresses, so keys are
# swept periodically rather than left to accumulate for the life of the process.
_SWEEP_EVERY = 512
_checks_since_sweep = 0


def _live_locked(key: str, now: float, *, create: bool) -> deque[float] | None:
    """`key`'s unexpired hits, pruned. Caller must hold `_LOCK`.

    `create=False` for read-only callers, so merely asking about an address does
    not plant an entry for it — on a public endpoint that would be a way to grow
    the dict without ever tripping a limit.
    """
    expiries = _HITS.setdefault(key, deque()) if create else _HITS.get(key)
    if expiries is None:
        return None

    while expiries and expiries[0] <= now:
        expiries.popleft()
    return expiries


def _retry_after(expiries: deque[float], limit: int, now: float) -> float | None:
    if len(expiries) < limit:
        return None
    # The oldest hit is the one that has to age out before there is room.
    return max(1.0, expiries[0] - now)


def check(key: str, *, limit: int, window_seconds: int) -> float | None:
    """Tests `key` against `limit` and spends a hit if there was room.

    Returns None when the call is allowed, otherwise the seconds until it would
    be — the caller's `Retry-After`. A bare 429 tells a guest whose reply was
    refused nothing about when to try again.

    For callers that spend on every request. Where only *failures* should count,
    use `over_limit` + `record` instead, so a legitimate caller is never
    throttled by their own successes.
    """
    now = time.monotonic()

    with _LOCK:
        _sweep_locked(now)
        expiries = _live_locked(key, now, create=True)
        assert expiries is not None  # create=True always returns a deque

        retry_after = _retry_after(expiries, limit, now)
        if retry_after is None:
            expiries.append(now + window_seconds)
        return retry_after


def over_limit(key: str, *, limit: int) -> float | None:
    """Whether `key` is out of budget, without spending any of it."""
    now = time.monotonic()

    with _LOCK:
        _sweep_locked(now)
        expiries = _live_locked(key, now, create=False)
        if not expiries:
            return None
        return _retry_after(expiries, limit, now)


def record(key: str, *, window_seconds: int) -> None:
    """Spends one hit against `key`, whether or not that puts it over a limit.

    Deliberately unconditional: the caller has already decided this attempt
    counts, and refusing to record here would let a burst that arrives together
    slip through under the limit it just exceeded.
    """
    now = time.monotonic()

    with _LOCK:
        expiries = _live_locked(key, now, create=True)
        assert expiries is not None
        expiries.append(now + window_seconds)


def clear(key: str) -> None:
    """Forgets `key`'s hits — for when a success proves the caller legitimate."""
    with _LOCK:
        _HITS.pop(key, None)


def _sweep_locked(now: float) -> None:
    """Drops keys whose hits have all expired. Caller must hold `_LOCK`."""
    global _checks_since_sweep

    _checks_since_sweep += 1
    if _checks_since_sweep < _SWEEP_EVERY:
        return
    _checks_since_sweep = 0

    # Materialised before deleting — mutating a dict while iterating it raises.
    for key in [key for key, expiries in _HITS.items() if not expiries or expiries[-1] <= now]:
        del _HITS[key]


def reset() -> None:
    """Clears every counter. For tests — nothing in the app should call it."""
    with _LOCK:
        _HITS.clear()
