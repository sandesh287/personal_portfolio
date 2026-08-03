from collections import defaultdict, deque
from collections.abc import Awaitable, Callable
from time import monotonic

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: object, requests: int, window_seconds: int) -> None:
        super().__init__(app)
        self.requests = requests
        self.window_seconds = window_seconds
        self.history: dict[str, deque[float]] = defaultdict(deque)

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        client_host = request.client.host if request.client else "unknown"
        now = monotonic()
        timestamps = self.history[client_host]

        while timestamps and now - timestamps[0] > self.window_seconds:
            timestamps.popleft()

        if len(timestamps) >= self.requests:
            return JSONResponse(
                status_code=429,
                content={
                    "success": False,
                    "data": None,
                    "message": "Too many requests.",
                    "errors": [
                        {
                            "code": "rate_limited",
                            "message": "Too many requests.",
                            "field": None,
                        }
                    ],
                },
            )

        timestamps.append(now)
        return await call_next(request)
