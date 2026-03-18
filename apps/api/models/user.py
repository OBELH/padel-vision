import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), default="player")  # player | club_admin | admin
    is_active: Mapped[bool] = mapped_column(default=True)
    player_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("players.id"))
    club_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("clubs.id"))
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    player: Mapped["Player | None"] = relationship()
    club: Mapped["Club | None"] = relationship()
