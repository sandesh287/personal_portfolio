from app.api.v1.router import api_router
from app.core.exceptions import ApiError, api_error_handler
from app.core.logging import configure_logging
from app.core.settings import settings
from app.middleware.request_id import RequestIdMiddleware
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def create_app() -> FastAPI:
    configure_logging()

    app = FastAPI(title=settings.app_name)
    app.add_exception_handler(ApiError, api_error_handler)
    app.add_middleware(RequestIdMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.backend_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(api_router, prefix=settings.api_v1_prefix)

    return app
