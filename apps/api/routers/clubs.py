import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.session import get_db
from models.club import Club
from schemas.club import ClubCreate, ClubRead, ClubUpdate

router = APIRouter(prefix="/api/clubs", tags=["clubs"])


@router.get("/", response_model=list[ClubRead])
def list_clubs(db: Session = Depends(get_db)):
    return db.query(Club).all()


@router.post("/", response_model=ClubRead, status_code=201)
def create_club(data: ClubCreate, db: Session = Depends(get_db)):
    club = Club(**data.model_dump())
    db.add(club)
    db.commit()
    db.refresh(club)
    return club


@router.get("/{club_id}", response_model=ClubRead)
def get_club(club_id: uuid.UUID, db: Session = Depends(get_db)):
    club = db.get(Club, club_id)
    if not club:
        raise HTTPException(404, "Club not found")
    return club


@router.put("/{club_id}", response_model=ClubRead)
def update_club(club_id: uuid.UUID, data: ClubUpdate, db: Session = Depends(get_db)):
    club = db.get(Club, club_id)
    if not club:
        raise HTTPException(404, "Club not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(club, key, value)
    db.commit()
    db.refresh(club)
    return club


@router.delete("/{club_id}", status_code=204)
def delete_club(club_id: uuid.UUID, db: Session = Depends(get_db)):
    club = db.get(Club, club_id)
    if not club:
        raise HTTPException(404, "Club not found")
    db.delete(club)
    db.commit()


@router.get("/{club_id}/stats")
def get_club_stats(club_id: uuid.UUID, db: Session = Depends(get_db)):
    from models.match import Match
    from models.player import Player

    club = db.get(Club, club_id)
    if not club:
        raise HTTPException(404, "Club not found")

    total_matches = db.query(Match).filter(Match.club_id == club_id).count()
    completed = db.query(Match).filter(Match.club_id == club_id, Match.status == "completed").count()
    total_players = db.query(Player).filter(Player.club_id == club_id).count()

    return {
        "club_id": str(club_id),
        "total_matches": total_matches,
        "completed_matches": completed,
        "total_players": total_players,
        "courts_count": club.courts_count,
    }
