import subprocess
from pathlib import Path


UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads"


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
                "ffmpeg", "-y",
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
    except (subprocess.CalledProcessError, FileNotFoundError):
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
                "ffmpeg", "-y",
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
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False
