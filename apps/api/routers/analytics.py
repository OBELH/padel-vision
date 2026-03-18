import uuid
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, cast, Date
from sqlalchemy.orm import Session

from db.session import get_db
from models.analytics import PageView, ShareEvent
from schemas.analytics import (
    AnalyticsDashboard,
    DailyCount,
    EntityStats,
    TrackShareRequest,
    TrackViewRequest,
)

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.post("/track-view", status_code=201)
def track_view(data: TrackViewRequest, request: Request, db: Session = Depends(get_db)):
    """Track a page view event. Called by the frontend on page load."""
    view = PageView(
        entity_type=data.entity_type,
        entity_id=data.entity_id,
        referrer=data.referrer,
        user_agent=request.headers.get("user-agent", "")[:500],
    )
    db.add(view)
    db.commit()
    return {"status": "tracked"}


@router.post("/track-share", status_code=201)
def track_share(data: TrackShareRequest, db: Session = Depends(get_db)):
    """Track a share event. Called by the frontend after share/copy."""
    event = ShareEvent(
        entity_type=data.entity_type,
        entity_id=data.entity_id,
        method=data.method,
        platform=data.platform,
    )
    db.add(event)
    db.commit()
    return {"status": "tracked"}


@router.get("/entity/{entity_type}/{entity_id}")
def get_entity_stats(
    entity_type: str,
    entity_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Get view/share counts for a specific entity."""
    views = db.query(PageView).filter(
        PageView.entity_type == entity_type,
        PageView.entity_id == entity_id,
    ).count()
    shares = db.query(ShareEvent).filter(
        ShareEvent.entity_type == entity_type,
        ShareEvent.entity_id == entity_id,
    ).count()
    return EntityStats(
        entity_type=entity_type,
        entity_id=entity_id,
        views=views,
        shares=shares,
    )


@router.get("/dashboard", response_model=AnalyticsDashboard)
def get_dashboard(
    days: int = Query(30, le=90),
    club_id: uuid.UUID | None = Query(None),
    db: Session = Depends(get_db),
):
    """Get analytics dashboard data."""
    today = date.today()
    start_date = today - timedelta(days=days)

    # Total counts
    total_views = db.query(PageView).count()
    total_shares = db.query(ShareEvent).count()

    # Today counts
    today_start = datetime(today.year, today.month, today.day)
    views_today = db.query(PageView).filter(PageView.created_at >= today_start).count()
    shares_today = db.query(ShareEvent).filter(ShareEvent.created_at >= today_start).count()

    # Top highlights by views
    top_highlights_q = (
        db.query(
            PageView.entity_id,
            func.count(PageView.id).label("view_count"),
        )
        .filter(PageView.entity_type == "highlight")
        .group_by(PageView.entity_id)
        .order_by(func.count(PageView.id).desc())
        .limit(5)
        .all()
    )

    top_highlights = []
    for entity_id, view_count in top_highlights_q:
        share_count = db.query(ShareEvent).filter(
            ShareEvent.entity_type == "highlight",
            ShareEvent.entity_id == entity_id,
        ).count()
        top_highlights.append(EntityStats(
            entity_type="highlight",
            entity_id=entity_id,
            views=view_count,
            shares=share_count,
        ))

    # Top matches by views
    top_matches_q = (
        db.query(
            PageView.entity_id,
            func.count(PageView.id).label("view_count"),
        )
        .filter(PageView.entity_type == "match")
        .group_by(PageView.entity_id)
        .order_by(func.count(PageView.id).desc())
        .limit(5)
        .all()
    )

    top_matches = []
    for entity_id, view_count in top_matches_q:
        share_count = db.query(ShareEvent).filter(
            ShareEvent.entity_type == "match",
            ShareEvent.entity_id == entity_id,
        ).count()
        top_matches.append(EntityStats(
            entity_type="match",
            entity_id=entity_id,
            views=view_count,
            shares=share_count,
        ))

    # Daily views (last N days)
    daily_views_q = (
        db.query(
            func.date(PageView.created_at).label("day"),
            func.count(PageView.id).label("count"),
        )
        .filter(PageView.created_at >= datetime(start_date.year, start_date.month, start_date.day))
        .group_by(func.date(PageView.created_at))
        .order_by(func.date(PageView.created_at))
        .all()
    )
    daily_views = [DailyCount(date=str(d), count=c) for d, c in daily_views_q]

    # Daily shares (last N days)
    daily_shares_q = (
        db.query(
            func.date(ShareEvent.created_at).label("day"),
            func.count(ShareEvent.id).label("count"),
        )
        .filter(ShareEvent.created_at >= datetime(start_date.year, start_date.month, start_date.day))
        .group_by(func.date(ShareEvent.created_at))
        .order_by(func.date(ShareEvent.created_at))
        .all()
    )
    daily_shares = [DailyCount(date=str(d), count=c) for d, c in daily_shares_q]

    return AnalyticsDashboard(
        total_views=total_views,
        total_shares=total_shares,
        views_today=views_today,
        shares_today=shares_today,
        top_highlights=top_highlights,
        top_matches=top_matches,
        daily_views=daily_views,
        daily_shares=daily_shares,
    )
