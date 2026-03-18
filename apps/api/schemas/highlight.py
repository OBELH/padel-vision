import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class HighlightBase(BaseModel):
    player_id: uuid.UUID | None = None
    timestamp_sec: int | None = None
    type: str
    description: str | None = None
    video_url: str | None = None


class HighlightCreate(HighlightBase):
    pass


class HighlightRead(HighlightBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    match_id: uuid.UUID
    clip_path: str | None = None
    thumbnail_path: str | None = None
    created_at: datetime
