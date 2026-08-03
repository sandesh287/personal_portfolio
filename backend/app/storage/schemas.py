from app.schemas.base import ApiSchema


class StoredFilePayload(ApiSchema):
    path: str
    filename: str
    content_type: str
    size: int
