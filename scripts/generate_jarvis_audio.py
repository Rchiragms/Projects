"""Regenerate ALL static JARVIS clips with the SAME Northern English Piper model.

Run from your Next.js project root:
    py scripts\\generate_jarvis_audio.py

The generated WAVs REPLACE the old versions, including enter.wav (no 'sir').
"""
from pathlib import Path
import json
import re
import subprocess
import sys

PROJECT = Path(__file__).resolve().parents[1]
VOICE = "en_GB-northern_english_male-medium"
LINES_FILE = PROJECT / "lib" / "voice" / "lines.json"
NAME_FILE = PROJECT / "lib" / "voice" / "pronunciation.json"
OUTPUT = PROJECT / "public" / "audio" / "jarvis"


def audio_text(text: str, names: dict[str, str]) -> str:
    text = re.sub(
        r"\bChirag\s+Nayaka\s+M\.?\s*S\.?\b",
        names["spokenFullName"], text, flags=re.IGNORECASE
    )
    return re.sub(
        r"\bChirag\b", names["spokenFirstName"], text, flags=re.IGNORECASE
    )


def main() -> None:
    model = PROJECT / f"{VOICE}.onnx"
    config = PROJECT / f"{VOICE}.onnx.json"
    if not model.is_file() or not config.is_file():
        raise SystemExit(
            "Piper voice files missing from your project root. "
            f"Run: py -m piper.download_voices {VOICE}"
        )

    lines = json.loads(LINES_FILE.read_text(encoding="utf-8"))
    names = json.loads(NAME_FILE.read_text(encoding="utf-8"))
    items = [(key, text) for key, text in lines["cues"].items()]
    items.extend((filename, text) for text, filename in lines["phrases"].items())
    OUTPUT.mkdir(parents=True, exist_ok=True)

    for number, (filename, text) in enumerate(items, start=1):
        destination = OUTPUT / f"{filename}.wav"
        spoken = audio_text(text, names)
        print(f"[{number}/{len(items)}] {filename}.wav: {spoken}", flush=True)
        subprocess.run([
            sys.executable, "-m", "piper", "-m", VOICE,
            "-f", str(destination), "--", spoken
        ], check=True, cwd=PROJECT)

    print(f"Updated {len(items)} clips in {OUTPUT}")
    print("IMPORTANT: Restart Next.js and hard-refresh the browser to replace cached WAVs.")


if __name__ == "__main__":
    main()
