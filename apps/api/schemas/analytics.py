import uuid
from datetime import date

from pydantic import BaseModel


class TrackViewRequest(BaseModel):
    entity_type: str  # match, highlight, player
    entity_id: uuid.UUID
    referrer: str | None = None


class TrackShareRequest(BaseModel):
    entity_type: str  # match, highlight, player
    entity_id: uuid.UUID
    method: str  # webshare, clipboard
    platform: str | None = None  # mobile, desktop


class EntityStats(BaseModel):
    entity_type: str
    entity_id: uuid.UUID
    views: int
    shares: int


class DailyCount(BaseModel):
    date: str
    count: int


class AnalyticsDashboard(BaseModel):
    total_views: int
    total_shares: int
    views_today: int
    shares_today: int
    top_highlights: list[EntityStats]
    top_matches: list[EntityStats]
    daily_views: list[DailyCount]
    daily_shares: list[DailyCount]
