import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from db.session import get_db
from models.highlight import Highlight
from models.match import Match
from models.match_player import MatchPlayer
from models.player import Player
from schemas.highlight import HighlightCreate, HighlightRead
from services.video import path_to_url

router = APIRouter(tags=["highlights"])


@router.get("/api/matches/{match_id}/highlights", response_model=list[HighlightRead])
def list_highlights(match_id: uuid.UUID, db: Session = Depends(get_db)):
    return db.query(Highlight).filter(Highlight.match_id == match_id).all()


@router.post("/api/matches/{match_id}/highlights", response_model=HighlightRead, status_code=201)
def create_highlight(match_id: uuid.UUID, data: HighlightCreate, db: Session = Depends(get_db)):
    match = db.get(Match, match_id)
    if not match:
        raise HTTPException(404, "Match not found")
    highlight = Highlight(match_id=match_id, **data.model_dump())
    db.add(highlight)
    db.commit()
    db.refresh(highlight)
    return highlight


@router.delete("/api/highlights/{highlight_id}", status_code=204)
def delete_highlight(highlight_id: uuid.UUID, db: Session = Depends(get_db)):
    highlight = db.get(Highlight, highlight_id)
    if not highlight:
        raise HTTPException(404, "Highlight not found")
    db.delete(highlight)
    db.commit()


@router.get("/api/highlights/{highlight_id}/share")
def get_highlight_share(highlight_id: uuid.UUID, request: Request, db: Session = Depends(get_db)):
    """Get shareable highlight data with resolved URLs and match context."""
    highlight = db.get(Highlight, highlight_id)
    if not highlight:
        raise HTTPException(404, "Highlight not found")

    match = db.get(Match, highlight.match_id)
    if not match:
        raise HTTPException(404, "Match not found")

    # Get player name
    player_name = None
    if highlight.player_id:
        player = db.get(Player, highlight.player_id)
        if player:
            player_name = player.full_name

    # Get team rosters
    match_players = db.query(MatchPlayer).filter(MatchPlayer.match_id == match.id).all()
    team_a_players = []
    team_b_players = []
    for mp in match_players:
        p = db.get(Player, mp.player_id)
        if p:
            if mp.team == "A":
                team_a_players.append(p.full_name)
            else:
                team_b_players.append(p.full_name)

    # Resolve file paths to HTTP URLs
    base_url = str(request.base_url).rstrip("/")
    clip_url = path_to_url(highlight.clip_path, base_url)
    thumbnail_url = path_to_url(highlight.thumbnail_path, base_url)

    return {
        "highlight_id": str(highlight.id),
        "type": highlight.type,
        "description": highlight.description,
        "timestamp_sec": highlight.timestamp_sec,
        "confidence": highlight.confidence,
        "source": highlight.source,
        "player_name": player_name,
        "match_id": str(match.id),
        "match_date": match.scheduled_at.isoformat() if match.scheduled_at else None,
        "score_team_a": match.score_team_a,
        "score_team_b": match.score_team_b,
        "team_a_players": team_a_players,
        "team_b_players": team_b_players,
        "clip_url": clip_url,
        "thumbnail_url": thumbnail_url,
    }
