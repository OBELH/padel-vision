import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ClubBase(BaseModel):
    name: str
    address: str | None = None
    city: str | None = None
    phone: str | None = None
    email: str | None = None
    courts_count: int = 0


class ClubCreate(ClubBase):
    pass


class ClubUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    city: str | None = None
    phone: str | None = None
    email: str | None = None
    courts_count: int | None = None


class ClubRead(ClubBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
