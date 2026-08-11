from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import api_router
from app.config import settings


def create_app() -> FastAPI:
    app = FastAPI(title="Wedding Invitation SaaS API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        # An explicit origin list, not ["*"] — allow_credentials=True and a
        # wildcard are mutually exclusive, and browsers reject the combination.
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router)

    @app.get("/health", tags=["health"])
    def health_check() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
