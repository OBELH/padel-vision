import uuid
from datetime import datetime

from sqlalchemy import Date, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from db.base import Base


class PageView(Base):
    """Track page views for matches, highlights, and players."""
    __tablename__ = "page_views"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    entity_type: Mapped[str] = mapped_column(String(20), index=True)  # match, highlight, player
    entity_id: Mapped[uuid.UUID] = mapped_column(index=True)
    referrer: Mapped[str | None] = mapped_column(String(500))
    user_agent: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class ShareEvent(Base):
    """Track share actions (Web Share API or clipboard copy)."""
    __tablename__ = "share_events"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    entity_type: Mapped[str] = mapped_column(String(20), index=True)  # match, highlight, player
    entity_id: Mapped[uuid.UUID] = mapped_column(index=True)
    method: Mapped[str] = mapped_column(String(20))  # webshare, clipboard
    platform: Mapped[str | None] = mapped_column(String(50))  # mobile, desktop
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
