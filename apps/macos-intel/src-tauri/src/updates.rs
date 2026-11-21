//! Assisted update checks against GitHub Releases.
//! Downloads a verified zip for manual replace — never silent in-place install.

use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::time::Duration;

const REPO: &str = "AnkitParekh007/job-search-assistant";
const ASSET_PREFIX: &str = "Job-Search-Assistant";
const USER_AGENT: &str = "Job-Search-Assistant-Updater/0.1";

fn agent() -> ureq::Agent {
    ureq::AgentBuilder::new()
        .timeout_connect(Duration::from_secs(15))
        .timeout_read(Duration::from_secs(120))
        .build()
}

fn map_err(e: ureq::Error) -> String {
    match e {
        ureq::Error::Status(code, resp) => {
            let body = resp.into_string().unwrap_or_default();
            let snippet: String = body.chars().take(180).collect();
            format!("GitHub HTTP {code}: {snippet}")
        }
        other => other.to_string(),
    }
}

fn strip_v(tag: &str) -> &str {
    tag.strip_prefix('v').unwrap_or(tag)
}

fn parse_version(s: &str) -> Result<semver::Version, String> {
    semver::Version::parse(strip_v(s.trim())).map_err(|e| format!("Invalid version '{s}': {e}"))
}

/// Platform zip name for this build target.
pub fn platform_asset(version: &str) -> String {
    let ver = strip_v(version);
    #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
    {
        format!("{ASSET_PREFIX}-{ver}-macos-arm64.zip")
    }
    #[cfg(all(target_os = "macos", target_arch = "x86_64"))]
    {
        format!("{ASSET_PREFIX}-{ver}-macos-x64.zip")
    }
    #[cfg(all(target_os = "windows", target_arch = "x86_64"))]
    {
        format!("{ASSET_PREFIX}-{ver}-windows-x64.zip")
    }
    #[cfg(not(any(
        all(target_os = "macos", target_arch = "aarch64"),
        all(target_os = "macos", target_arch = "x86_64"),
        all(target_os = "windows", target_arch = "x86_64")
    )))]
    {
        format!("{ASSET_PREFIX}-{ver}-unknown.zip")
    }
}

fn github_get_json(url: &str) -> Result<Value, String> {
    let resp = agent()
        .get(url)
        .set("User-Agent", USER_AGENT)
        .set("Accept", "application/vnd.github+json")
        .call()
        .map_err(map_err)?;
    resp.into_json().map_err(|e| e.to_string())
}

fn github_get_bytes(url: &str) -> Result<Vec<u8>, String> {
    let resp = agent()
        .get(url)
        .set("User-Agent", USER_AGENT)
        .set("Accept", "application/octet-stream")
        .call()
        .map_err(map_err)?;
    let mut buf = Vec::new();
    resp.into_reader()
        .read_to_end(&mut buf)
        .map_err(|e| e.to_string())?;
    Ok(buf)
}

fn github_get_text(url: &str) -> Result<String, String> {
    let bytes = github_get_bytes(url)?;
    String::from_utf8(bytes).map_err(|e| e.to_string())
}

/// Pick the newest non-draft, non-prerelease release (GitHub `/latest` already filters these).
fn fetch_latest_release() -> Result<Value, String> {
    let url = format!("https://api.github.com/repos/{REPO}/releases/latest");
    let release = github_get_json(&url)?;
    if release.get("draft").and_then(|v| v.as_bool()).unwrap_or(false)
        || release
            .get("prerelease")
            .and_then(|v| v.as_bool())
            .unwrap_or(false)
    {
        // Fallback: walk recent releases for the first regular one.
        let list_url = format!("https://api.github.com/repos/{REPO}/releases?per_page=20");
        let list = github_get_json(&list_url)?;
        let arr = list
            .as_array()
            .ok_or_else(|| "Unexpected GitHub releases list".to_string())?;
        for item in arr {
            let draft = item.get("draft").and_then(|v| v.as_bool()).unwrap_or(false);
            let pre = item
                .get("prerelease")
                .and_then(|v| v.as_bool())
                .unwrap_or(false);
            if !draft && !pre {
                return Ok(item.clone());
            }
        }
        return Err("No regular (non-prerelease) GitHub Release found".into());
    }
    Ok(release)
}

fn asset_download_url(release: &Value, name: &str) -> Option<String> {
    release
        .get("assets")
        .and_then(|a| a.as_array())
        .and_then(|arr| {
            arr.iter().find_map(|a| {
                let n = a.get("name").and_then(|n| n.as_str())?;
                if n == name {
                    a.get("browser_download_url")
                        .and_then(|u| u.as_str())
                        .map(|s| s.to_string())
                } else {
                    None
                }
            })
        })
}

fn expected_sha256(sums_text: &str, asset_name: &str) -> Option<String> {
    for line in sums_text.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        let mut parts = line.split_whitespace();
        let hash = parts.next()?;
        let file = parts.next()?.trim_start_matches('*');
        if file == asset_name || file.ends_with(asset_name) {
            return Some(hash.to_lowercase());
        }
    }
    None
}

fn file_sha256(path: &Path) -> Result<String, String> {
    let mut file = File::open(path).map_err(|e| e.to_string())?;
    let mut hasher = Sha256::new();
    let mut buf = [0u8; 64 * 1024];
    loop {
        let n = file.read(&mut buf).map_err(|e| e.to_string())?;
        if n == 0 {
            break;
        }
        hasher.update(&buf[..n]);
    }
    Ok(format!("{:x}", hasher.finalize()))
}

fn downloads_dir() -> Result<PathBuf, String> {
    dirs::download_dir()
        .or_else(|| dirs::home_dir().map(|h| h.join("Downloads")))
        .ok_or_else(|| "Could not resolve Downloads folder".into())
}

/// Check GitHub Releases for a newer regular release than `current_version`.
pub fn check_for_update(current_version: &str) -> Result<Value, String> {
    let current = parse_version(current_version)?;
    let release = fetch_latest_release()?;
    let tag = release
        .get("tag_name")
        .and_then(|t| t.as_str())
        .ok_or("Release missing tag_name")?
        .to_string();
    let latest = parse_version(&tag)?;
    let asset = platform_asset(&tag);
    let asset_url = asset_download_url(&release, &asset);
    let notes_url = release
        .get("html_url")
        .and_then(|u| u.as_str())
        .unwrap_or("")
        .to_string();
    let has_asset = asset_url.is_some();

    let (status, message) = if latest > current {
        if has_asset {
            (
                "available",
                format!("Version {latest} is available. Download the zip, quit the app, replace the .app, then right-click → Open if Gatekeeper prompts. Do not disable Gatekeeper."),
            )
        } else {
            (
                "available_no_asset",
                format!("Version {latest} is published but no {asset} package is on that release. Use the release notes or build from source."),
            )
        }
    } else if latest == current {
        (
            "up_to_date",
            format!("You are on the latest regular release ({current})."),
        )
    } else {
        (
            "ahead",
            format!("Installed {current} is newer than the latest regular release ({latest})."),
        )
    };

    Ok(json!({
        "status": status,
        "current": current.to_string(),
        "latest": latest.to_string(),
        "tag": tag,
        "asset": asset,
        "url": asset_url,
        "notes_url": notes_url,
        "downloaded_path": Value::Null,
        "sha256_ok": Value::Null,
        "message": message,
    }))
}

/// Download `asset` from `tag`, verify against SHA256SUMS.txt, write to Downloads.
pub fn download_update(tag: &str, asset: &str) -> Result<Value, String> {
    if tag.trim().is_empty() || asset.trim().is_empty() {
        return Err("tag and asset are required".into());
    }
    if asset.contains("..") || asset.contains('/') || asset.contains('\\') {
        return Err("Invalid asset name".into());
    }

    let tag = tag.trim();
    let asset = asset.trim();
    let expected_name = platform_asset(tag);
    if asset != expected_name {
        return Err(format!(
            "Asset '{asset}' does not match this platform's package '{expected_name}'"
        ));
    }

    let release_url = format!("https://api.github.com/repos/{REPO}/releases/tags/{tag}");
    let release = github_get_json(&release_url)?;
    if release
        .get("prerelease")
        .and_then(|v| v.as_bool())
        .unwrap_or(false)
    {
        return Err("Refusing to download a prerelease".into());
    }

    let asset_url = asset_download_url(&release, asset)
        .ok_or_else(|| format!("Release {tag} has no asset named {asset}"))?;
    let sums_url = asset_download_url(&release, "SHA256SUMS.txt").or_else(|| {
        // Some publishes use SHA256SUMS-{version}.txt locally; on GitHub we standardize on SHA256SUMS.txt.
        None
    });

    let dest_dir = downloads_dir()?;
    fs::create_dir_all(&dest_dir).map_err(|e| e.to_string())?;
    let dest = dest_dir.join(asset);
    let partial = dest_dir.join(format!("{asset}.partial"));

    let bytes = github_get_bytes(&asset_url)?;
    {
        let mut f = File::create(&partial).map_err(|e| e.to_string())?;
        f.write_all(&bytes).map_err(|e| e.to_string())?;
        f.sync_all().map_err(|e| e.to_string())?;
    }

    let mut sha256_ok = false;
    let mut message = format!(
        "Downloaded to {}. Quit the app, replace your installed .app with the new one, then right-click → Open if Gatekeeper prompts. Do not disable Gatekeeper.",
        dest.display()
    );

    if let Some(sums_url) = sums_url {
        match github_get_text(&sums_url) {
            Ok(sums) => match expected_sha256(&sums, asset) {
                Some(expected) => {
                    let actual = file_sha256(&partial)?;
                    if actual != expected {
                        let _ = fs::remove_file(&partial);
                        return Err(format!(
                            "SHA-256 mismatch for {asset}. Expected {expected}, got {actual}. Partial download removed."
                        ));
                    }
                    sha256_ok = true;
                    message = format!(
                        "Downloaded and SHA-256 verified to {}. Quit the app, replace your installed .app, then right-click → Open if Gatekeeper prompts. Do not disable Gatekeeper.",
                        dest.display()
                    );
                }
                None => {
                    message = format!(
                        "Downloaded to {} but SHA256SUMS.txt had no entry for {asset}. Verify manually before replacing the app.",
                        dest.display()
                    );
                }
            },
            Err(e) => {
                message = format!(
                    "Downloaded to {} but could not fetch SHA256SUMS.txt ({e}). Verify manually before replacing the app.",
                    dest.display()
                );
            }
        }
    } else {
        message = format!(
            "Downloaded to {} but this release has no SHA256SUMS.txt. Verify manually before replacing the app.",
            dest.display()
        );
    }

    fs::rename(&partial, &dest).map_err(|e| {
        let _ = fs::remove_file(&partial);
        e.to_string()
    })?;

    let current = env!("CARGO_PKG_VERSION");
    let latest = strip_v(tag);
    let notes_url = release
        .get("html_url")
        .and_then(|u| u.as_str())
        .unwrap_or("")
        .to_string();

    Ok(json!({
        "status": "downloaded",
        "current": current,
        "latest": latest,
        "tag": tag,
        "asset": asset,
        "url": asset_url,
        "notes_url": notes_url,
        "downloaded_path": dest.to_string_lossy(),
        "sha256_ok": sha256_ok,
        "message": message,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn strip_and_parse() {
        assert_eq!(parse_version("v0.1.4").unwrap().to_string(), "0.1.4");
        assert_eq!(parse_version("0.1.3").unwrap().to_string(), "0.1.3");
    }

    #[test]
    fn sums_parse() {
        let text = "abc123  Job-Search-Assistant-0.1.4-macos-arm64.zip\ndef456 *other.zip\n";
        assert_eq!(
            expected_sha256(text, "Job-Search-Assistant-0.1.4-macos-arm64.zip").as_deref(),
            Some("abc123")
        );
    }

    #[test]
    fn newer_detect() {
        let cur = parse_version("0.1.3").unwrap();
        let lat = parse_version("v0.1.4").unwrap();
        assert!(lat > cur);
    }
}
