#!/usr/bin/env python3
"""Fail closed if release downloads are source-only archives rather than native apps."""
from __future__ import annotations

import sys
from pathlib import Path
from zipfile import ZipFile, is_zipfile


PLATFORMS = ("macos-arm64", "macos-x64", "windows-x64")


def verify_archive(path: Path, platform: str) -> None:
    if not path.is_file() or not is_zipfile(path):
        raise ValueError(f"{path}: missing or invalid ZIP")
    with ZipFile(path) as archive:
        entries = [item for item in archive.infolist() if not item.is_dir()]
        files = [item.filename.replace("\\", "/") for item in entries]
        if not files:
            raise ValueError(f"{path}: empty ZIP")
        if any(name.startswith("/") or ".." in name.split("/") for name in files):
            raise ValueError(f"{path}: unsafe archive paths")
        if any("/src-tauri/" in f"/{name}" or "/node_modules/" in f"/{name}" for name in files):
            raise ValueError(f"{path}: contains source/dependency directories")
        if platform.startswith("macos"):
            plist_files = [name for name in files if name.endswith(".app/Contents/Info.plist")]
            if len(plist_files) != 1:
                raise ValueError(f"{path}: expected one real .app/Contents/Info.plist")
            app_prefix = plist_files[0].removesuffix("Contents/Info.plist")
            binary_files = [
                item for item in entries
                if item.filename.replace("\\", "/").startswith(app_prefix + "Contents/MacOS/")
                and item.file_size > 0
            ]
            if not binary_files:
                raise ValueError(f"{path}: no executable payload in .app/Contents/MacOS")
        elif platform == "windows-x64":
            installers = [
                item for item in entries
                if item.filename.lower().endswith((".msi", ".exe")) and item.file_size > 0
            ]
            if not installers:
                raise ValueError(f"{path}: missing Windows .exe or .msi installer")
        else:
            raise ValueError(f"Unexpected platform: {platform}")


def verify_release(directory: Path, version: str) -> None:
    if not version or not all(part.isdigit() for part in version.split(".")) or len(version.split(".")) != 3:
        raise ValueError("Version must be MAJOR.MINOR.PATCH")
    expected = {f"AI-Job-Search-{version}-{platform}.zip" for platform in PLATFORMS}
    actual = {path.name for path in directory.glob("*.zip")}
    if actual != expected:
        raise ValueError(f"Unexpected/missing archives: missing={sorted(expected - actual)}, unexpected={sorted(actual - expected)}")
    for platform in PLATFORMS:
        verify_archive(directory / f"AI-Job-Search-{version}-{platform}.zip", platform)


if __name__ == "__main__":
    try:
        if len(sys.argv) != 3:
            raise ValueError("Usage: verify-release-assets.py DIST_DIR MAJOR.MINOR.PATCH")
        verify_release(Path(sys.argv[1]), sys.argv[2])
        print("OK: all release ZIPs contain native executables/installers (not source-only packages)")
    except (ValueError, OSError) as error:
        print(f"RELEASE BLOCKED: {error}", file=sys.stderr)
        sys.exit(1)
