import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from db.session import get_db
from models.player import Player
from schemas.player import PlayerCreate, PlayerRead, PlayerUpdate

router = APIRouter(prefix="/api/players", tags=["players"])


@router.get("/", response_model=list[PlayerRead])
def list_players(club_id: uuid.UUID | None = Query(None), db: Session = Depends(get_db)):
    q = db.query(Player)
    if club_id:
        q = q.filter(Player.club_id == club_id)
    return q.all()


@router.post("/", response_model=PlayerRead, status_code=201)
def create_player(data: PlayerCreate, db: Session = Depends(get_db)):
    player = Player(**data.model_dump())
    db.add(player)
    db.commit()
    db.refresh(player)
    return player


@router.get("/{player_id}", response_model=PlayerRead)
def get_player(player_id: uuid.UUID, db: Session = Depends(get_db)):
    player = db.get(Player, player_id)
    if not player:
        raise HTTPException(404, "Player not found")
    return player


@router.put("/{player_id}", response_model=PlayerRead)
def update_player(player_id: uuid.UUID, data: PlayerUpdate, db: Session = Depends(get_db)):
    player = db.get(Player, player_id)
    if not player:
        raise HTTPException(404, "Player not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(player, key, value)
    db.commit()
    db.refresh(player)
    return player


@router.delete("/{player_id}", status_code=204)
def delete_player(player_id: uuid.UUID, db: Session = Depends(get_db)):
    player = db.get(Player, player_id)
    if not player:
        raise HTTPException(404, "Player not found")
    db.delete(player)
    db.commit()


@router.get("/{player_id}/stats")
def get_player_stats(player_id: uuid.UUID, db: Session = Depends(get_db)):
    from models.highlight import Highlight
    from models.match import Match
    from models.match_player import MatchPlayer

    player = db.get(Player, player_id)
    if not player:
        raise HTTPException(404, "Player not found")

    # Get all matches for this player
    match_ids = [mp.match_id for mp in db.query(MatchPlayer).filter(MatchPlayer.player_id == player_id).all()]
    total_matches = len(match_ids)

    wins = 0
    total_duration = 0
    for mid in match_ids:
        match = db.get(Match, mid)
        if not match or match.status != "completed":
            continue
        mp = db.query(MatchPlayer).filter(MatchPlayer.match_id == mid, MatchPlayer.player_id == player_id).first()
        if not mp:
            continue
        if match.duration_minutes:
            total_duration += match.duration_minutes
        # Determine winner by checking score
        if match.score_team_a and match.score_team_b:
            sets_a = sum(1 for s in match.score_team_a.split() if "-" in s and int(s.split("-")[0]) > int(s.split("-")[1]))
            sets_b = sum(1 for s in match.score_team_b.split() if "-" in s and int(s.split("-")[0]) > int(s.split("-")[1]))
            if (mp.team == "A" and sets_a > sets_b) or (mp.team == "B" and sets_b > sets_a):
                wins += 1

    # Highlights
    highlights = db.query(Highlight).filter(Highlight.player_id == player_id).all()
    smashes = sum(1 for h in highlights if h.type == "smash")
    aces = sum(1 for h in highlights if h.type == "ace")
    lobs = sum(1 for h in highlights if h.type == "lob")

    # Recent matches with details
    recent = []
    for mid in match_ids[-5:]:
        match = db.get(Match, mid)
        if match:
            mp = db.query(MatchPlayer).filter(MatchPlayer.match_id == mid, MatchPlayer.player_id == player_id).first()
            recent.append({
                "match_id": str(mid),
                "scheduled_at": match.scheduled_at.isoformat(),
                "status": match.status,
                "score_team_a": match.score_team_a,
                "score_team_b": match.score_team_b,
                "team": mp.team if mp else None,
                "duration_minutes": match.duration_minutes,
            })

    return {
        "player_id": str(player_id),
        "total_matches": total_matches,
        "wins": wins,
        "losses": total_matches - wins,
        "win_rate": round(wins / total_matches * 100) if total_matches > 0 else 0,
        "total_highlights": len(highlights),
        "smashes": smashes,
        "aces": aces,
        "lobs": lobs,
        "total_play_time_minutes": total_duration,
        "recent_matches": recent,
    }
