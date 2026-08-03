from dataclasses import dataclass
from typing import Generic, TypeVar

PayloadT = TypeVar("PayloadT")


@dataclass(frozen=True)
class ServiceResult(Generic[PayloadT]):
    payload: PayloadT
    message: str | None = None


class BaseService:
    def result(self, payload: PayloadT, message: str | None = None) -> ServiceResult[PayloadT]:
        return ServiceResult(payload=payload, message=message)
