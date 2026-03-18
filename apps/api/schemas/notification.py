import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    type: str
    title: str
    message: str
    link: str | None = None
    is_read: bool
    created_at: datetime


class NotificationCount(BaseModel):
    unread: int
    total: int
