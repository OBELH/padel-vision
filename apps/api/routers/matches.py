import shutil
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from db.session import get_db
from models.highlight import Highlight
from models.match import Match
from models.match_player import MatchPlayer
from schemas.match import MatchCreate, MatchRead, MatchReadDetailed, MatchUpdate
from schemas.match_player import MatchPlayerCreate, MatchPlayerRead
from services.video import UPLOADS_DIR, ensure_dir, extract_clip, extract_thumbnail

router = APIRouter(prefix="/api/matches", tags=["matches"])


@router.get("/", response_model=list[MatchRead])
def list_matches(
    club_id: uuid.UUID | None = Query(None),
    status: str | None = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Match)
    if club_id:
        q = q.filter(Match.club_id == club_id)
    if status:
        q = q.filter(Match.status == status)
    return q.all()


@router.post("/", response_model=MatchRead, status_code=201)
def create_match(data: MatchCreate, db: Session = Depends(get_db)):
    match = Match(**data.model_dump())
    db.add(match)
    db.commit()
    db.refresh(match)
    return match


@router.get("/{match_id}", response_model=MatchReadDetailed)
def get_match(match_id: uuid.UUID, db: Session = Depends(get_db)):
    match = db.get(Match, match_id)
    if not match:
        raise HTTPException(404, "Match not found")
    return match


@router.put("/{match_id}", response_model=MatchRead)
def update_match(match_id: uuid.UUID, data: MatchUpdate, db: Session = Depends(get_db)):
    match = db.get(Match, match_id)
    if not match:
        raise HTTPException(404, "Match not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(match, key, value)
    db.commit()
    db.refresh(match)
    return match


@router.delete("/{match_id}", status_code=204)
def delete_match(match_id: uuid.UUID, db: Session = Depends(get_db)):
    match = db.get(Match, match_id)
    if not match:
        raise HTTPException(404, "Match not found")
    db.delete(match)
    db.commit()


# Match Players sub-routes

@router.post("/{match_id}/players", response_model=MatchPlayerRead, status_code=201)
def add_player_to_match(match_id: uuid.UUID, data: MatchPlayerCreate, db: Session = Depends(get_db)):
    match = db.get(Match, match_id)
    if not match:
        raise HTTPException(404, "Match not found")
    mp = MatchPlayer(match_id=match_id, **data.model_dump())
    db.add(mp)
    db.commit()
    db.refresh(mp)
    return mp


@router.delete("/{match_id}/players/{player_id}", status_code=204)
def remove_player_from_match(match_id: uuid.UUID, player_id: uuid.UUID, db: Session = Depends(get_db)):
    mp = db.query(MatchPlayer).filter(
        MatchPlayer.match_id == match_id, MatchPlayer.player_id == player_id
    ).first()
    if not mp:
        raise HTTPException(404, "Player not in match")
    db.delete(mp)
    db.commit()


# Video endpoints

@router.post("/{match_id}/upload-video")
async def upload_video(match_id: uuid.UUID, file: UploadFile, db: Session = Depends(get_db)):
    match = db.get(Match, match_id)
    if not match:
        raise HTTPException(404, "Match not found")

    match_dir = UPLOADS_DIR / "matches" / str(match_id)
    ensure_dir(match_dir)

    video_path = match_dir / "full.mp4"
    with open(video_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    match.video_path = str(video_path)
    db.commit()
    db.refresh(match)

    return {"message": "Video uploaded", "video_path": str(video_path)}


@router.post("/{match_id}/generate-clips")
def generate_clips(match_id: uuid.UUID, db: Session = Depends(get_db)):
    match = db.get(Match, match_id)
    if not match:
        raise HTTPException(404, "Match not found")
    if not match.video_path:
        raise HTTPException(400, "No video uploaded for this match")

    highlights = db.query(Highlight).filter(
        Highlight.match_id == match_id,
        Highlight.timestamp_sec.isnot(None),
    ).all()

    if not highlights:
        raise HTTPException(400, "No highlights with timestamps found")

    clips_dir = UPLOADS_DIR / "matches" / str(match_id) / "clips"
    thumbs_dir = UPLOADS_DIR / "matches" / str(match_id) / "thumbnails"
    ensure_dir(clips_dir)
    ensure_dir(thumbs_dir)

    results = []
    for h in highlights:
        clip_out = str(clips_dir / f"{h.id}.mp4")
        thumb_out = str(thumbs_dir / f"{h.id}.jpg")

        clip_ok = extract_clip(match.video_path, h.timestamp_sec, 10, clip_out)
        thumb_ok = extract_thumbnail(match.video_path, h.timestamp_sec, thumb_out)

        if clip_ok:
            h.clip_path = clip_out
        if thumb_ok:
            h.thumbnail_path = thumb_out

        results.append({
            "highlight_id": str(h.id),
            "clip": clip_ok,
            "thumbnail": thumb_ok,
        })

    db.commit()
    return {"generated": len(results), "results": results}


@router.get("/{match_id}/video-status")
def video_status(match_id: uuid.UUID, db: Session = Depends(get_db)):
    match = db.get(Match, match_id)
    if not match:
        raise HTTPException(404, "Match not found")

    highlights = db.query(Highlight).filter(Highlight.match_id == match_id).all()
    clips_count = sum(1 for h in highlights if h.clip_path)

    return {
        "has_video": bool(match.video_path),
        "total_highlights": len(highlights),
        "clips_generated": clips_count,
    }
