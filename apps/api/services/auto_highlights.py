"""Auto-highlights orchestrator — full pipeline: audio peaks → Claude Vision → highlights."""

import os
import uuid
from pathlib import Path

import anthropic
from dotenv import load_dotenv
from sqlalchemy.orm import Session

# Ensure .env is loaded from the api directory
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)

from models.highlight import Highlight
from models.match import Match
from services.audio_analysis import detect_audio_peaks
from services.video import UPLOADS_DIR, ensure_dir, extract_clip, extract_thumbnail
from services.vision_analysis import classify_highlight


def analyze_match_video(match_id: uuid.UUID, db: Session) -> dict:
    """
    Full AI analysis pipeline for a match video.

    1. Detect audio peaks (loud moments = potential highlights)
    2. Classify each peak with Claude Vision
    3. Filter low-confidence results
    4. Create Highlight records in DB
    5. Extract clips + thumbnails via FFmpeg

    Returns summary dict with results.
    """
    # 1. Get the match and verify video exists
    match = db.get(Match, match_id)
    if not match:
        return {"error": "Match not found"}
    if not match.video_path:
        return {"error": "No video uploaded for this match"}

    video_path = match.video_path
    print(f"[AutoHighlights] Starting analysis for match {match_id}")
    print(f"[AutoHighlights] Video: {video_path}")

    # 2. Detect audio peaks
    print("[AutoHighlights] Phase 1: Audio analysis...")
    peaks = detect_audio_peaks(video_path, min_distance_sec=5)

    if not peaks:
        print("[AutoHighlights] No audio peaks detected")
        return {
            "peaks_detected": 0,
            "highlights_created": 0,
            "highlights": [],
        }

    print(f"[AutoHighlights] Found {len(peaks)} audio peaks")

    # 3. Classify each peak with Claude Vision
    print("[AutoHighlights] Phase 2: Claude Vision classification...")
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return {"error": "ANTHROPIC_API_KEY not configured in .env"}

    client = anthropic.Anthropic(api_key=api_key)
    classifications = []

    for i, timestamp in enumerate(peaks):
        print(f"[AutoHighlights] Classifying peak {i + 1}/{len(peaks)} at t={timestamp}s...")
        result = classify_highlight(video_path, timestamp, client)
        result["timestamp_sec"] = timestamp
        classifications.append(result)

    # 4. Filter: keep only real highlights with confidence >= 40
    valid = [c for c in classifications if c.get("is_highlight") and c.get("confidence", 0) >= 40]
    print(f"[AutoHighlights] {len(valid)}/{len(classifications)} passed confidence filter")
    # Log all classifications for debugging
    for c in classifications:
        print(f"  → t={c['timestamp_sec']}s: {c.get('type','?')} conf={c.get('confidence',0)} highlight={c.get('is_highlight',False)} - {c.get('description','')}")

    # 5. Create highlights in DB + extract clips
    clips_dir = UPLOADS_DIR / "matches" / str(match_id) / "clips"
    thumbs_dir = UPLOADS_DIR / "matches" / str(match_id) / "thumbnails"
    ensure_dir(clips_dir)
    ensure_dir(thumbs_dir)

    created_highlights = []
    for c in valid:
        # Create highlight record
        highlight = Highlight(
            match_id=match_id,
            timestamp_sec=c["timestamp_sec"],
            type=c.get("type", "autre"),
            description=c.get("description"),
            confidence=c.get("confidence", 0),
            source="auto",
        )
        db.add(highlight)
        db.flush()  # Get the ID

        # Extract clip + thumbnail
        clip_path = str(clips_dir / f"{highlight.id}.mp4")
        thumb_path = str(thumbs_dir / f"{highlight.id}.jpg")

        clip_ok = extract_clip(video_path, c["timestamp_sec"], 10, clip_path)
        thumb_ok = extract_thumbnail(video_path, c["timestamp_sec"], thumb_path)

        if clip_ok:
            highlight.clip_path = clip_path
        if thumb_ok:
            highlight.thumbnail_path = thumb_path

        created_highlights.append({
            "id": str(highlight.id),
            "type": highlight.type,
            "description": highlight.description,
            "timestamp_sec": highlight.timestamp_sec,
            "confidence": highlight.confidence,
            "clip_ok": clip_ok,
            "thumbnail_ok": thumb_ok,
        })

    db.commit()
    print(f"[AutoHighlights] Created {len(created_highlights)} highlights with clips")

    # 6. Send notifications to relevant users
    if created_highlights:
        try:
            from services.notifications import notify_highlights_ready
            notif_count = notify_highlights_ready(
                db=db,
                match_id=match_id,
                highlights_count=len(created_highlights),
                club_id=match.club_id,
            )
            db.commit()
            print(f"[AutoHighlights] Sent {notif_count} notifications")
        except Exception as e:
            print(f"[AutoHighlights] Notification error (non-fatal): {e}")

    return {
        "peaks_detected": len(peaks),
        "classified": len(classifications),
        "highlights_created": len(created_highlights),
        "highlights": created_highlights,
        "all_classifications": [
            {"timestamp_sec": c["timestamp_sec"], "type": c.get("type"), "confidence": c.get("confidence", 0), "is_highlight": c.get("is_highlight", False), "description": c.get("description")}
            for c in classifications
        ],
    }
