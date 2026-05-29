#!/usr/bin/env python3
"""Rebuild data/paris/uqi-by-arrondissement.json from raw CSV/JSON inputs."""
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
BUILDER = ROOT / "scripts" / "_build_paris_data_inline.py"

if __name__ == "__main__":
    # Re-run the inline builder used during initial setup
    inline = ROOT / "scripts" / "build_paris_data.py"
    if inline.exists():
        sys.exit(subprocess.call([sys.executable, str(inline)]))
    print("Run the project setup script or place raw files in data/paris/raw/")
    sys.exit(1)
