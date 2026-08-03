from fastapi import APIRouter

from app.auth.router import router as auth_router
from app.core.settings import settings
from app.features.analytics.router import router as analytics_router
from app.features.blog.router import router as blog_router
from app.features.experience.router import router as experience_router
from app.features.media.router import router as media_router
from app.features.messages.router import router as messages_router
from app.features.projects.router import router as projects_router
from app.features.resume.router import router as resume_router
from app.features.settings.router import router as settings_router
from app.features.skills.router import router as skills_router
from app.schemas.base import ApiResponse, HealthPayload

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(projects_router, prefix="/projects", tags=["projects"])
api_router.include_router(blog_router, prefix="/blog", tags=["blog"])
api_router.include_router(skills_router, prefix="/skills", tags=["skills"])
api_router.include_router(experience_router, prefix="/experience", tags=["experience"])
api_router.include_router(resume_router, prefix="/resume", tags=["resume"])
api_router.include_router(media_router, prefix="/media", tags=["media"])
api_router.include_router(messages_router, prefix="/messages", tags=["messages"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
api_router.include_router(settings_router, prefix="/settings", tags=["settings"])


@api_router.get("/health", response_model=ApiResponse[HealthPayload], tags=["health"])
async def health_check() -> ApiResponse[HealthPayload]:
    return ApiResponse(
        data=HealthPayload(
            status="ok",
            version=settings.app_version,
            environment=settings.environment,
        )
    )
