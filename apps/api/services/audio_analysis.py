"""Audio analysis service — detect high-energy moments in match videos."""

import tempfile
import subprocess
from pathlib import Path

import librosa
import numpy as np

from services.video import FFMPEG, ensure_dir


def extract_audio(video_path: str, output_path: str) -> bool:
    """Extract audio track from video as WAV using FFmpeg."""
    ensure_dir(Path(output_path).parent)
    try:
        subprocess.run(
            [
                FFMPEG, "-y",
                "-i", video_path,
                "-vn",  # no video
                "-acodec", "pcm_s16le",
                "-ar", "22050",  # 22kHz sample rate (good enough for peak detection)
                "-ac", "1",  # mono
                output_path,
            ],
            check=True,
            capture_output=True,
        )
        return True
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"[Audio extraction ERROR] {e}")
        return False


def detect_audio_peaks(
    video_path: str,
    min_distance_sec: int = 5,
    threshold_factor: float = 2.0,
    hop_length: int = 512,
) -> list[int]:
    """
    Detect high-energy moments in a video via audio analysis.

    Uses RMS energy envelope to find peaks above a dynamic threshold
    (mean + threshold_factor * std). Peaks closer than min_distance_sec
    are merged.

    Returns a sorted list of timestamps (in seconds).
    """
    # 1. Extract audio to temp WAV file
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        wav_path = tmp.name

    try:
        if not extract_audio(video_path, wav_path):
            print("[Audio] Failed to extract audio track")
            return []

        # 2. Load audio with librosa
        y, sr = librosa.load(wav_path, sr=22050, mono=True)
        duration = librosa.get_duration(y=y, sr=sr)
        print(f"[Audio] Loaded {duration:.1f}s of audio at {sr}Hz")

        if len(y) == 0:
            print("[Audio] Empty audio track")
            return []

        # 3. Compute RMS energy envelope
        rms = librosa.feature.rms(y=y, hop_length=hop_length)[0]
        times = librosa.frames_to_time(range(len(rms)), sr=sr, hop_length=hop_length)

        # 4. Dynamic threshold: mean + factor * std
        mean_rms = np.mean(rms)
        std_rms = np.std(rms)
        threshold = mean_rms + threshold_factor * std_rms
        print(f"[Audio] RMS stats: mean={mean_rms:.4f}, std={std_rms:.4f}, threshold={threshold:.4f}")

        # 5. Find peaks above threshold
        peak_indices = np.where(rms > threshold)[0]
        if len(peak_indices) == 0:
            print("[Audio] No peaks above threshold")
            return []

        peak_times = times[peak_indices]

        # 6. Merge peaks closer than min_distance_sec
        merged: list[int] = []
        for t in peak_times:
            t_sec = int(round(t))
            # Clamp to valid range (at least 2s from start, 2s from end)
            t_sec = max(2, min(t_sec, int(duration) - 2))
            if not merged or (t_sec - merged[-1]) >= min_distance_sec:
                merged.append(t_sec)

        print(f"[Audio] Detected {len(merged)} peaks: {merged}")
        return merged

    finally:
        # Cleanup temp file
        Path(wav_path).unlink(missing_ok=True)
