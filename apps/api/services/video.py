import os
import shutil
import subprocess
from pathlib import Path


UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads"


def path_to_url(filesystem_path: str | None, base_url: str) -> str | None:
    """Convert an absolute filesystem path to an HTTP URL for static serving."""
    if not filesystem_path:
        return None
    normalized = filesystem_path.replace("\\", "/")
    idx = normalized.find("uploads/")
    if idx == -1:
        return None
    return f"{base_url.rstrip('/')}/{normalized[idx:]}"


def _ffmpeg_bin() -> str:
    """Find FFmpeg binary — check PATH first, then known Windows install locations."""
    found = shutil.which("ffmpeg")
    if found:
        return found
    # Winget install location
    winget_path = Path.home() / "AppData/Local/Microsoft/WinGet/Packages"
    for p in winget_path.glob("Gyan.FFmpeg*/ffmpeg-*/bin/ffmpeg.exe"):
        return str(p)
    return "ffmpeg"  # fallback


FFMPEG = _ffmpeg_bin()


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def extract_clip(
    video_path: str,
    start_sec: int,
    duration_sec: int,
    output_path: str,
) -> bool:
    """Extract a clip from a video using FFmpeg."""
    ensure_dir(Path(output_path).parent)
    try:
        subprocess.run(
            [
                FFMPEG, "-y",
                "-ss", str(start_sec),
                "-i", video_path,
                "-t", str(duration_sec),
                "-c:v", "libx264",
                "-c:a", "aac",
                "-movflags", "+faststart",
                output_path,
            ],
            check=True,
            capture_output=True,
        )
        return True
    except subprocess.CalledProcessError as e:
        print(f"[FFmpeg clip ERROR] {e.stderr.decode() if e.stderr else e}")
        return False
    except FileNotFoundError as e:
        print(f"[FFmpeg NOT FOUND] {e}")
        return False


def extract_thumbnail(
    video_path: str,
    timestamp_sec: int,
    output_path: str,
) -> bool:
    """Extract a single frame as a JPEG thumbnail."""
    ensure_dir(Path(output_path).parent)
    try:
        subprocess.run(
            [
                FFMPEG, "-y",
                "-ss", str(timestamp_sec),
                "-i", video_path,
                "-frames:v", "1",
                "-q:v", "2",
                output_path,
            ],
            check=True,
            capture_output=True,
        )
        return True
    except subprocess.CalledProcessError as e:
        print(f"[FFmpeg thumb ERROR] {e.stderr.decode() if e.stderr else e}")
        return False
    except FileNotFoundError as e:
        print(f"[FFmpeg NOT FOUND] {e}")
        return False
