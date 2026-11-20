"""Regression tests: published release archives must contain native app binaries."""
from __future__ import annotations

import importlib.util
import tempfile
import unittest
from pathlib import Path
from zipfile import ZipFile

MODULE = Path(__file__).resolve().parents[1] / "verify-release-assets.py"
spec = importlib.util.spec_from_file_location("release_validator", MODULE)
assert spec is not None and spec.loader is not None
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)


class ReleaseAssetTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name)

    def write(self, platform, files, version="0.2.0"):
        dest = self.path / f"AI-Job-Search-{version}-{platform}.zip"
        with ZipFile(dest, "w") as zip_file:
            for name, content in files.items():
                zip_file.writestr(name, content)
        return dest

    def test_rejects_source_only_mac_archives(self):
        archive = self.write("macos-arm64", {
            "macos-arm64/app/package.json": '{"name":"app"}',
            "macos-arm64/app/src/App.tsx": "export {}",
        })
        with self.assertRaisesRegex(ValueError, "Info.plist"):
            validator.verify_archive(archive, "macos-arm64")

    def test_rejects_source_only_windows_archive(self):
        archive = self.write("windows-x64", {"windows-x64/app/README.md": "run npm install"})
        with self.assertRaisesRegex(ValueError, "installer"):
            validator.verify_archive(archive, "windows-x64")

    def test_accepts_real_mac_bundle(self):
        archive = self.write("macos-arm64", {
            "AI Job Search.app/Contents/Info.plist": "plist",
            "AI Job Search.app/Contents/MacOS/AI Job Search": "binary",
        })
        validator.verify_archive(archive, "macos-arm64")

    def test_accepts_installer(self):
        archive = self.write("windows-x64", {"AI Job Search_0.2.0_x64-setup.exe": "binary"})
        validator.verify_archive(archive, "windows-x64")

    def test_requires_all_platforms(self):
        self.write("macos-arm64", {
            "AI Job Search.app/Contents/Info.plist": "plist",
            "AI Job Search.app/Contents/MacOS/AI Job Search": "binary",
        })
        with self.assertRaisesRegex(ValueError, "missing"):
            validator.verify_release(self.path, "0.2.0")

    def test_rejects_archive_traversal(self):
        archive = self.write("windows-x64", {
            "../installer.exe": "malicious",
        })
        with self.assertRaisesRegex(ValueError, "unsafe"):
            validator.verify_archive(archive, "windows-x64")


if __name__ == "__main__":
    unittest.main()
