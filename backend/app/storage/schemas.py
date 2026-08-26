from app.schemas.base import ApiSchema


class StoredFilePayload(ApiSchema):
    path: str
    public_url: str | None = None
    filename: str
    content_type: str
    size: int
    image_width: int | None = None
    image_height: int | None = None
    placeholder_url: str | None = None
