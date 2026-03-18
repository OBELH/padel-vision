import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PlayerBase(BaseModel):
    email: str
    full_name: str
    nickname: str | None = None
    phone: str | None = None
    level: str | None = None
    club_id: uuid.UUID | None = None


class PlayerCreate(PlayerBase):
    pass


class PlayerUpdate(BaseModel):
    email: str | None = None
    full_name: str | None = None
    nickname: str | None = None
    phone: str | None = None
    level: str | None = None
    club_id: uuid.UUID | None = None


class PlayerRead(PlayerBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
