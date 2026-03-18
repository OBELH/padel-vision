import uuid

from pydantic import BaseModel, ConfigDict


class MatchPlayerBase(BaseModel):
    player_id: uuid.UUID
    team: str
    position: str | None = None


class MatchPlayerCreate(MatchPlayerBase):
    pass


class MatchPlayerRead(MatchPlayerBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    match_id: uuid.UUID
