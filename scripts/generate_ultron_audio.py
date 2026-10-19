"""Generate ULTRON mission dialogue from a DIFFERENT mature male Piper model.

This is an original fictional enemy voice (not James Spader / Marvel audio).
JARVIS recordings remain unchanged.
"""
from pathlib import Path
import json
import subprocess
import sys

PROJECT = Path(__file__).resolve().parents[1]
MODEL = "en_US-norman-medium"
SCRIPT = PROJECT / "lib" / "voice" / "ultron-lines.json"
OUTPUT = PROJECT / "public" / "audio" / "ultron"


def main() -> None:
    model = PROJECT / f"{MODEL}.onnx"
    config = PROJECT / f"{MODEL}.onnx.json"
    if not model.is_file() or not config.is_file():
        sys.exit(
            f"Missing Piper voice model: {MODEL}\n"
            f"Run this in your project root: py -m piper.download_voices {MODEL}"
        )

    lines: dict[str, str] = json.loads(SCRIPT.read_text(encoding="utf-8"))
    OUTPUT.mkdir(parents=True, exist_ok=True)

    for position, (cue, words) in enumerate(lines.items(), 1):
        filename = OUTPUT / f"{cue}.wav"
        print(f"[{position}/{len(lines)}] ULTRON: {cue}.wav", flush=True)
        subprocess.run(
            [sys.executable, "-m", "piper", "-m", MODEL,
             "-f", str(filename), "--", words],
            check=True,
            cwd=PROJECT,
        )

    print(f"Generated {len(lines)} ULTRON clips in {OUTPUT}")
    print("Open /audio/ultron/intro.wav in your browser to test them.")


if __name__ == "__main__":
    main()
