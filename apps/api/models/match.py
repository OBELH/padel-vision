import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class Match(Base):
    __tablename__ = "matches"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    club_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clubs.id"))
    court_number: Mapped[int | None] = mapped_column(Integer)
    scheduled_at: Mapped[datetime]
    status: Mapped[str] = mapped_column(String(20), default="scheduled")
    score_team_a: Mapped[str | None] = mapped_column(String(20))
    score_team_b: Mapped[str | None] = mapped_column(String(20))
    duration_minutes: Mapped[int | None] = mapped_column(Integer)
    video_path: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    club: Mapped["Club"] = relationship(back_populates="matches")
    match_players: Mapped[list["MatchPlayer"]] = relationship(back_populates="match", cascade="all, delete-orphan")
    highlights: Mapped[list["Highlight"]] = relationship(back_populates="match", cascade="all, delete-orphan")
