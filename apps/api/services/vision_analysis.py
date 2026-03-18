"""Vision analysis service — classify padel highlights using Claude Vision API."""

import base64
import json
import subprocess
import tempfile
from pathlib import Path

import anthropic

from services.video import FFMPEG, ensure_dir


VISION_PROMPT = """Tu es un analyste expert de padel. Analyse ces frames consécutives extraites d'un match de padel.

Réponds UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "type": "smash" | "ace" | "lob" | "point_gagnant" | "defense" | "autre",
  "description": "Description courte de l'action en français (max 10 mots)",
  "confidence": 0-100,
  "is_highlight": true | false
}

Règles de classification :
- "smash" = frappe puissante vers le bas depuis une position haute, joueur au filet
- "ace" = service gagnant sans retour de l'adversaire
- "lob" = balle haute par-dessus les adversaires au filet (trajectoire ascendante)
- "point_gagnant" = dernier coup d'un échange, point marqué visiblement
- "defense" = récupération spectaculaire, contra-pared, sauvetage
- "autre" = action non remarquable ou impossible à déterminer
- is_highlight = false si c'est un moment ordinaire (marche, pause, entre-points, discussion)
- confidence < 50 = incertain, l'action n'est pas claire sur les frames

Réponds UNIQUEMENT avec le JSON, rien d'autre."""


def extract_frames(
    video_path: str,
    timestamp_sec: int,
    offsets: list[float] = [-1.0, 0.0, 1.0],
) -> list[bytes]:
    """Extract multiple frames around a timestamp as JPEG bytes."""
    frames: list[bytes] = []

    for offset in offsets:
        t = max(0, timestamp_sec + offset)
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            tmp_path = tmp.name

        try:
            result = subprocess.run(
                [
                    FFMPEG, "-y",
                    "-ss", str(t),
                    "-i", video_path,
                    "-frames:v", "1",
                    "-q:v", "2",
                    "-vf", "scale=640:-1",  # Resize to 640px wide (save API tokens)
                    tmp_path,
                ],
                capture_output=True,
            )
            if result.returncode == 0 and Path(tmp_path).stat().st_size > 0:
                frames.append(Path(tmp_path).read_bytes())
        except (subprocess.CalledProcessError, FileNotFoundError, OSError) as e:
            print(f"[Vision] Frame extraction error at t={t}: {e}")
        finally:
            Path(tmp_path).unlink(missing_ok=True)

    return frames


def classify_highlight(
    video_path: str,
    timestamp_sec: int,
    client: anthropic.Anthropic,
    model: str = "claude-sonnet-4-20250514",
) -> dict:
    """
    Classify a moment in a padel match using Claude Vision.

    Extracts 3 frames around the timestamp and sends them to Claude
    for classification.

    Returns dict with keys: type, description, confidence, is_highlight
    """
    # 1. Extract frames
    frames = extract_frames(video_path, timestamp_sec)
    if not frames:
        print(f"[Vision] No frames extracted at t={timestamp_sec}s")
        return {
            "type": "autre",
            "description": "Frames non disponibles",
            "confidence": 0,
            "is_highlight": False,
        }

    # 2. Build message content with images
    content: list[dict] = []
    for i, frame_bytes in enumerate(frames):
        b64 = base64.b64encode(frame_bytes).decode("utf-8")
        content.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": "image/jpeg",
                "data": b64,
            },
        })
    content.append({"type": "text", "text": VISION_PROMPT})

    # 3. Call Claude Vision
    try:
        response = client.messages.create(
            model=model,
            max_tokens=256,
            messages=[{"role": "user", "content": content}],
        )

        # 4. Parse JSON response
        text = response.content[0].text.strip()
        # Handle potential markdown code block wrapping
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
            text = text.rsplit("```", 1)[0]
        text = text.strip()

        result = json.loads(text)
        print(f"[Vision] t={timestamp_sec}s → {result['type']} ({result['confidence']}%) : {result['description']}")
        return result

    except (json.JSONDecodeError, KeyError, IndexError) as e:
        print(f"[Vision] Parse error at t={timestamp_sec}s: {e}")
        return {
            "type": "autre",
            "description": "Erreur d'analyse",
            "confidence": 0,
            "is_highlight": False,
        }
    except anthropic.BadRequestError as e:
        error_msg = str(e)
        if "credit balance" in error_msg.lower():
            print(f"[Vision] CREDITS INSUFFICIENT - Rechargez sur console.anthropic.com")
            return {
                "type": "autre",
                "description": "Credits API insuffisants",
                "confidence": 0,
                "is_highlight": False,
            }
        print(f"[Vision] Bad request at t={timestamp_sec}s: {e}")
        return {
            "type": "autre",
            "description": "Erreur requete API",
            "confidence": 0,
            "is_highlight": False,
        }
    except anthropic.APIError as e:
        print(f"[Vision] API error at t={timestamp_sec}s: {e}")
        return {
            "type": "autre",
            "description": "Erreur API",
            "confidence": 0,
            "is_highlight": False,
        }
