#!/usr/bin/env python3
"""Fail if relative Markdown links point at missing files."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LINK_RE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
SKIP_PREFIXES = ("http://", "https://", "mailto:", "#")


def iter_markdown() -> list[Path]:
    files: list[Path] = []
    for pattern in ("*.md", "docs/**/*.md", ".github/**/*.md"):
        files.extend(ROOT.glob(pattern))
    # de-dupe
    return sorted({p.resolve() for p in files if p.is_file()})


def check_file(path: Path) -> list[str]:
    errors: list[str] = []
    text = path.read_text(encoding="utf-8")
    for match in LINK_RE.finditer(text):
        raw = match.group(2).strip()
        if not raw or raw.startswith(SKIP_PREFIXES):
            continue
        # strip optional title and anchors
        target = raw.split()[0].strip("<>")
        if target.startswith("#"):
            continue
        file_part, _, _ = target.partition("#")
        if not file_part:
            continue
        resolved = (path.parent / file_part).resolve()
        if not resolved.exists():
            errors.append(f"{path.relative_to(ROOT)}: missing {file_part} (from {raw})")
    return errors


def main() -> int:
    all_errors: list[str] = []
    for path in iter_markdown():
        all_errors.extend(check_file(path))
    if all_errors:
        print("Broken relative Markdown links:\n", file=sys.stderr)
        for err in all_errors:
            print(f"  - {err}", file=sys.stderr)
        return 1
    print(f"OK: checked {len(iter_markdown())} Markdown files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
