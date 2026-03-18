import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.session import get_db
from models.highlight import Highlight
from models.match import Match
from schemas.highlight import HighlightCreate, HighlightRead

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
