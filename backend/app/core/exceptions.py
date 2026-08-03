from app.schemas.base import ErrorDetail
from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


class ApiError(Exception):
    def __init__(self, status_code: int, message: str, code: str = "api_error") -> None:
        self.status_code = status_code
        self.message = message
        self.code = code


async def api_error_handler(_: Request, exc: ApiError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "data": None,
            "message": exc.message,
            "errors": [ErrorDetail(code=exc.code, message=exc.message).model_dump()],
        },
    )


async def http_error_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
    message = str(exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "data": None,
            "message": message,
            "errors": [ErrorDetail(code="http_error", message=message).model_dump()],
        },
    )


async def validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    errors = [
        ErrorDetail(
            code="validation_error",
            message=str(error["msg"]),
            field=".".join(str(part) for part in error["loc"]),
        ).model_dump()
        for error in exc.errors()
    ]
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "data": None,
            "message": "Validation failed.",
            "errors": errors,
        },
    )
