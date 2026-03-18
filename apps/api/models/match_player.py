import uuid

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class MatchPlayer(Base):
    __tablename__ = "match_players"
    __table_args__ = (UniqueConstraint("match_id", "player_id"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    match_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("matches.id"))
    player_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("players.id"))
    team: Mapped[str] = mapped_column(String(1))
    position: Mapped[str | None] = mapped_column(String(20))

    match: Mapped["Match"] = relationship(back_populates="match_players")
    player: Mapped["Player"] = relationship(back_populates="match_players")
