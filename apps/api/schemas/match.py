import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from .match_player import MatchPlayerRead


class MatchBase(BaseModel):
    club_id: uuid.UUID
    court_number: int | None = None
    scheduled_at: datetime
    status: str = "scheduled"
    score_team_a: str | None = None
    score_team_b: str | None = None
    duration_minutes: int | None = None


class MatchCreate(MatchBase):
    pass


class MatchUpdate(BaseModel):
    court_number: int | None = None
    scheduled_at: datetime | None = None
    status: str | None = None
    score_team_a: str | None = None
    score_team_b: str | None = None
    duration_minutes: int | None = None


class MatchRead(MatchBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    video_path: str | None = None
    created_at: datetime
    updated_at: datetime


class MatchReadDetailed(MatchRead):
    match_players: list[MatchPlayerRead] = []
