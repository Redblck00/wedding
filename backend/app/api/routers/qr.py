from io import BytesIO

import qrcode
from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse

from app.api.deps import OwnedWedding
from app.config import settings

router = APIRouter(prefix="/weddings", tags=["qr"])


@router.get(
    "/{wedding_id}/qr",
    response_class=StreamingResponse,
    responses={200: {"content": {"image/png": {}}, "description": "QR code PNG"}},
)
def wedding_qr(
    wedding: OwnedWedding,
    box_size: int = Query(default=10, ge=4, le=40, description="Pixels per QR module"),
) -> StreamingResponse:
    """Renders the invitation's QR on the fly.

    Deliberately not stored: the slug can change, and a cached PNG would then
    point at a dead link. Regenerating costs milliseconds.
    """
    target_url = f"{settings.public_base_url.rstrip('/')}/wedding/{wedding.slug}"

    code = qrcode.QRCode(
        # The printed card may be handled, folded or partially covered; this
        # level recovers from ~30% damage, at the cost of a denser code.
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=box_size,
        border=4,
    )
    code.add_data(target_url)
    code.make(fit=True)

    buffer = BytesIO()
    code.make_image(fill_color="black", back_color="white").save(buffer, format="PNG")
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="image/png",
        headers={
            "Content-Disposition": f'inline; filename="{wedding.slug}-qr.png"',
            # No caching: the slug is editable, so a cached QR could outlive the
            # URL it encodes.
            "Cache-Control": "no-store",
        },
    )
