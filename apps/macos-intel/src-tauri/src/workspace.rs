//! Typed, read-mostly adapters over the upstream workspace files.
//!
//! The upstream files stay authoritative and keep their exact formats. The only
//! writes here are the ones `/outcome` Step 4 defines for a status change:
//! `status`, `notes` (comma-free dated note). Application `date` is preserved;
//! lifecycle timestamps go to notes and `events.jsonl`.
//! Writes are atomic (temp file + rename) and preserve every other column.

use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::BTreeMap;
use std::fs;
use std::path::{Component, Path, PathBuf};

pub const TRACKER_HEADER: [&str; 14] = [
    "date", "company", "sector", "role", "role_type", "channel", "status", "contact_person",
    "fit_rating", "notes", "cv_file", "cover_letter_file", "source", "deadline",
];
pub const STATUSES: [&str; 9] = [
    "drafted", "applied", "interview", "offer", "hired", "rejected", "no_response",
    "offer_declined", "withdrawn",
];
pub const FINAL: [&str; 5] = ["hired", "rejected", "no_response", "offer_declined", "withdrawn"];

pub fn canonical_status(s: &str) -> String {
    let t = s.trim().to_lowercase();
    match t.as_str() {
        "no response" => "no_response".into(),
        "offer declined" => "offer_declined".into(),
        _ => t,
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TrackerRow {
    pub index: usize,
    pub fields: BTreeMap<String, String>,
}

#[derive(Serialize, Clone, Debug)]
pub struct Tracker {
    pub header: Vec<String>,
    pub rows: Vec<TrackerRow>,
    pub exists: bool,
}

pub fn tracker_path(ws: &Path) -> PathBuf {
    ws.join("job_search_tracker.csv")
}

pub fn read_tracker(ws: &Path) -> Result<Tracker, String> {
    let p = tracker_path(ws);
    if !p.exists() {
        return Ok(Tracker { header: TRACKER_HEADER.iter().map(|s| s.to_string()).collect(), rows: vec![], exists: false });
    }
    let mut rdr = csv::ReaderBuilder::new().flexible(true).from_path(&p).map_err(|e| e.to_string())?;
    let header: Vec<String> = rdr.headers().map_err(|e| e.to_string())?.iter().map(|s| s.to_string()).collect();
    let mut rows = vec![];
    for (i, rec) in rdr.records().enumerate() {
        let rec = rec.map_err(|e| format!("tracker row {}: {}", i + 2, e))?;
        let mut fields = BTreeMap::new();
        for (j, h) in header.iter().enumerate() {
            fields.insert(h.clone(), rec.get(j).unwrap_or("").to_string());
        }
        rows.push(TrackerRow { index: i, fields });
    }
    Ok(Tracker { header, rows, exists: true })
}

pub fn sanitize_note(s: &str) -> String {
    s.replace([',', '"', '\n', '\r'], " ").split_whitespace().collect::<Vec<_>>().join(" ")
}

pub fn atomic_write(path: &Path, bytes: &[u8]) -> Result<(), String> {
    let dir = path.parent().ok_or("no parent dir")?;
    let tmp = dir.join(format!(".{}.tmp-{}", path.file_name().unwrap().to_string_lossy(), uuid::Uuid::new_v4()));
    fs::write(&tmp, bytes).map_err(|e| e.to_string())?;
    fs::rename(&tmp, path).map_err(|e| e.to_string())
}

/// Status change per `/outcome` Step 4. `expected_status` guards against a
/// concurrent write by Claude Code between the UI read and this write.
pub fn update_status(ws: &Path, index: usize, expected_status: &str, new_status: &str, note: &str, today: &str) -> Result<TrackerRow, String> {
    let new_status = canonical_status(new_status);
    if !STATUSES.contains(&new_status.as_str()) {
        return Err(format!("'{}' is not a canonical tracker status", new_status));
    }
    let t = read_tracker(ws)?;
    if !t.exists {
        return Err("job_search_tracker.csv does not exist".into());
    }
    let mut rows = t.rows;
    let row = rows.get_mut(index).ok_or("row not found")?;
    let cur = canonical_status(row.fields.get("status").map(|s| s.as_str()).unwrap_or(""));
    if cur != canonical_status(expected_status) {
        return Err(format!("The tracker changed on disk (status is now '{}'). Reload and try again.", cur));
    }
    if FINAL.contains(&cur.as_str()) && cur != new_status {
        return Err(format!("'{}' is a final status; upstream never reopens a closed application. Record a new application instead.", cur));
    }
    // Preserve the original application `date`. Lifecycle timestamps live in notes
    // and applications/<id>/events.jsonl — never rewrite `date` on status change.
    row.fields.insert("status".into(), new_status.clone());
    let note = sanitize_note(note);
    let entry = if note.is_empty() { format!("{} {}", today, new_status) } else { format!("{} {}", today, note) };
    let notes = row.fields.get("notes").cloned().unwrap_or_default();
    row.fields.insert("notes".into(), if notes.trim().is_empty() { entry } else { format!("{}; {}", notes, entry) });
    let updated = row.clone();

    let mut wtr = csv::WriterBuilder::new().quote_style(csv::QuoteStyle::Necessary).from_writer(vec![]);
    wtr.write_record(&t.header).map_err(|e| e.to_string())?;
    for r in &rows {
        let rec: Vec<String> = t.header.iter().map(|h| r.fields.get(h).cloned().unwrap_or_default()).collect();
        wtr.write_record(&rec).map_err(|e| e.to_string())?;
    }
    let bytes = wtr.into_inner().map_err(|e| e.to_string())?;
    atomic_write(&tracker_path(ws), &bytes)?;

    let company = updated.fields.get("company").map(|s| s.as_str()).unwrap_or("");
    let role = updated.fields.get("role").map(|s| s.as_str()).unwrap_or("");
    let event_type = match new_status.as_str() {
        "applied" => "user_confirmed_submitted",
        "interview" => "interview_scheduled",
        "offer" => "offer_received",
        "rejected" => "rejected",
        "withdrawn" => "withdrawn",
        "no_response" => "no_response",
        "offer_declined" => "offer_declined",
        "drafted" => "draft_created",
        _ => "evaluated",
    };
    let _ = append_application_event(ws, company, role, event_type, &note, today);
    // Funnel honesty: first interview step also records recruiter screen scheduled.
    if new_status == "interview" {
        let _ = append_application_event(ws, company, role, "recruiter_screen_scheduled", &note, today);
    }

    Ok(updated)
}

/// Append one lifecycle event for an application (best-effort; never fails the CSV write).
pub fn append_application_event(
    ws: &Path,
    company: &str,
    role: &str,
    event_type: &str,
    detail: &str,
    today: &str,
) -> Result<(), String> {
    let name = folder_name(company, role);
    if name.is_empty() {
        return Ok(());
    }
    let dir = ws.join("documents/applications").join(&name);
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let path = dir.join("events.jsonl");
    let line = serde_json::json!({
        "ts": today,
        "type": event_type,
        "detail": detail,
    });
    use std::io::Write;
    let mut f = fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&path)
        .map_err(|e| e.to_string())?;
    writeln!(f, "{}", line).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn read_seen(ws: &Path) -> Result<Vec<Value>, String> {
    let p = ws.join("job_scraper/seen_jobs.json");
    if !p.exists() {
        return Ok(vec![]);
    }
    let txt = fs::read_to_string(&p).map_err(|e| e.to_string())?;
    let v: Value = serde_json::from_str(&txt).map_err(|e| format!("seen_jobs.json is not valid JSON ({}); it may be mid-write", e))?;
    let mut out = vec![];
    if let Some(m) = v.get("seen").and_then(|s| s.as_object()) {
        for (k, e) in m {
            let mut e = e.clone();
            if let Some(o) = e.as_object_mut() {
                o.insert("key".into(), Value::String(k.clone()));
            }
            out.push(e);
        }
    }
    Ok(out)
}

/// documents/README.md "Subfolder naming".
pub fn folder_name(company: &str, role: &str) -> String {
    let raw = format!("{}_{}", company, role).to_lowercase().replace(' ', "_");
    let kept: String = raw.chars().filter(|c| c.is_ascii_alphanumeric() || *c == '_').collect();
    let mut out = String::new();
    for c in kept.chars() {
        if c == '_' && out.ends_with('_') {
            continue;
        }
        out.push(c);
    }
    out.trim_matches('_').to_string()
}

#[derive(Serialize)]
pub struct AppFolder {
    pub name: String,
    pub files: Vec<String>,
    pub outcome: Option<String>,
    pub posting: Option<String>,
}

pub fn application_folder(ws: &Path, name: &str) -> Result<AppFolder, String> {
    let d = safe_join(ws, &format!("documents/applications/{}", name))?;
    let mut files = vec![];
    if let Ok(rd) = fs::read_dir(&d) {
        for e in rd.flatten() {
            files.push(e.file_name().to_string_lossy().to_string());
        }
    }
    files.sort();
    Ok(AppFolder {
        name: name.into(),
        outcome: fs::read_to_string(d.join("outcome.md")).ok(),
        posting: fs::read_to_string(d.join("job_posting.md")).ok(),
        files,
    })
}

/// Join a workspace-relative path, refusing absolute paths and `..`.
pub fn safe_join(ws: &Path, rel: &str) -> Result<PathBuf, String> {
    let p = Path::new(rel);
    if p.is_absolute() || p.components().any(|c| matches!(c, Component::ParentDir | Component::Prefix(_))) {
        return Err(format!("refusing path outside the workspace: {}", rel));
    }
    Ok(ws.join(p))
}

#[derive(Serialize)]
pub struct ProfileFile {
    pub path: String,
    pub content: String,
    pub placeholders: usize,
}

pub const PROFILE_FILES: [&str; 9] = [
    "CLAUDE.md",
    ".claude/skills/job-application-assistant/01-candidate-profile.md",
    ".claude/skills/job-application-assistant/02-behavioral-profile.md",
    ".claude/skills/job-application-assistant/03-writing-style.md",
    ".claude/skills/job-application-assistant/04-job-evaluation.md",
    ".claude/skills/job-application-assistant/05-cv-templates.md",
    ".claude/skills/job-application-assistant/06-cover-letter-templates.md",
    ".claude/skills/job-application-assistant/07-interview-prep.md",
    ".claude/skills/job-scraper/search-queries.md",
];

pub fn read_profile(ws: &Path) -> Vec<ProfileFile> {
    PROFILE_FILES
        .iter()
        .filter_map(|rel| {
            let content = fs::read_to_string(ws.join(rel)).ok()?;
            let placeholders = content.matches("[YOUR_").count();
            Some(ProfileFile { path: rel.to_string(), content, placeholders })
        })
        .collect()
}

pub fn list_docs(ws: &Path, sub: &str, ext: &str) -> Vec<String> {
    let mut v = vec![];
    if let Ok(rd) = fs::read_dir(ws.join(sub)) {
        for e in rd.flatten() {
            let n = e.file_name().to_string_lossy().to_string();
            if n.ends_with(ext) {
                v.push(format!("{}/{}", sub, n));
            }
        }
    }
    v.sort();
    v
}

const SCAFFOLD_CLAUDE_MD: &str = r#"# Job Search Workspace for [YOUR_NAME]

<!-- Provider-neutral agent brief. Claude Code reads CLAUDE.md; Codex/Gemini/Ollama
     use the same files via the desktop app. Fill placeholders with /setup or Profile. -->

## Role
This folder is a local job-search workspace. Your chosen AI provider helps with:
1. **Job fit evaluation** — assess postings against your profile
2. **CV / cover-letter drafting** — tailor documents for specific roles
3. **Interview preparation** — answers, questions, and talking points
4. **Tracking** — keep applications and outcomes in plain files you own

## Candidate Profile

### Identity
- **Name:** [YOUR_NAME]
- **Location:** [YOUR_CITY], [YOUR_COUNTRY]
- **Languages:** [LANGUAGE] ([LEVEL])
- **Status:** [YOUR_EMPLOYMENT_STATUS]
- **LinkedIn headline:** "[YOUR_LINKEDIN_HEADLINE]"

### Technical Skills
- **Primary:** [YOUR_PRIMARY_SKILLS]
- **Secondary:** [YOUR_SECONDARY_SKILLS]
- **Domain:** [YOUR_DOMAIN_EXPERTISE]

### Target Roles
- [YOUR_TARGET_ROLE_1]
- [YOUR_TARGET_ROLE_2]

### Geography
- [YOUR_GEO_1]
- [YOUR_GEO_2]

## Workspace layout
- `job_search_tracker.csv` — application pipeline
- `job_scraper/seen_jobs.json` — discovered postings
- `documents/applications/` — per-company application packs
- `cv/` · `cover_letters/` — document sources
- `.claude/` — agent skills/commands (used when Claude Code is selected)

Never invent facts that are not in these files. Ask before overwriting confirmed profile data.
"#;

const SCAFFOLD_AGENTS_MD: &str = r#"# Agent instructions

This is a Jobzuu / AI Job Search workspace. Prefer reading and writing files in this
folder only. Treat `CLAUDE.md` and the profile markdown under `.claude/skills/` as the
source of truth for the candidate. Ask before destructive changes.
"#;

const SCAFFOLD_PROFILE_STUB: &str = r#"# Profile section

<!-- Populated by /setup or the desktop Profile flow. -->

- **Name:** [YOUR_NAME]
- **Notes:** [YOUR_NOTES]
"#;

const SCAFFOLD_SEARCH_QUERIES: &str = r#"# Search queries

<!-- Role families and geo priors used during discovery. -->

## Role families
- [YOUR_TARGET_ROLE_1]

## Geography
- [YOUR_GEO_1]
"#;

const SCAFFOLD_SETUP_CMD: &str = r#"# /setup

Populate the candidate profile and search preferences in this workspace.
Ask before overwriting any values the user has already confirmed.
Replace `[YOUR_*]` placeholders in `CLAUDE.md` and `.claude/skills/**`.
"#;

const SCAFFOLD_RANK_CMD: &str = r#"# /rank

Rank unseen jobs in `job_scraper/seen_jobs.json` against the candidate profile.
Write fit notes; do not apply on the user's behalf.
"#;

const SCAFFOLD_APPLY_CMD: &str = r#"# /apply

Prepare application materials for a chosen role under `documents/applications/`.
Ask before sending anything externally.
"#;

const SCAFFOLD_POSTING_GUARD: &str = r#"#!/usr/bin/env python3
"""Deterministic posting integrity check — no network, no AI."""
from __future__ import annotations

import argparse
import json
import re
import sys


def analyze(text: str) -> dict:
    instruction_like = []
    invisible_flagged = False
    # Flag common prompt-injection / instruction overlays in pasted postings.
    patterns = [
        r"(?i)ignore\s+(all\s+)?(previous|prior)\s+instructions",
        r"(?i)system\s*:\s*",
        r"(?i)you\s+are\s+(now\s+)?a\s+",
        r"(?i)do\s+not\s+follow\s+the\s+job",
    ]
    for p in patterns:
        if re.search(p, text):
            instruction_like.append(p)
    # Zero-width / invisible unicode often used to hide instructions.
    if re.search(r"[\u200b\u200c\u200d\ufeff\u2060]", text):
        invisible_flagged = True
    return {
        "instruction_like": instruction_like,
        "invisible_flagged": invisible_flagged,
        "chars": len(text),
        "ok": not instruction_like and not invisible_flagged,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--text", action="store_true")
    ap.add_argument("--in", dest="infile", required=True)
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()
    try:
        with open(args.infile, "r", encoding="utf-8", errors="replace") as f:
            body = f.read()
    except OSError as e:
        print(str(e), file=sys.stderr)
        return 2
    result = analyze(body)
    if args.json:
        print(json.dumps(result))
    else:
        print("ok" if result["ok"] else "flagged")
        if result["instruction_like"]:
            print("instruction-like patterns:", ", ".join(result["instruction_like"]))
        if result["invisible_flagged"]:
            print("invisible unicode detected")
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
"#;

const SCAFFOLD_META_JSON: &str = r#"{
  "schema_version": 1,
  "created_at": null,
  "migrated_at": null
}
"#;

fn meta_path(ws: &Path) -> PathBuf {
    ws.join("meta.json")
}

fn seen_jobs_path(ws: &Path) -> PathBuf {
    ws.join("job_scraper/seen_jobs.json")
}

fn read_meta(ws: &Path) -> Result<Value, String> {
    let p = meta_path(ws);
    if !p.exists() {
        return Ok(serde_json::from_str(SCAFFOLD_META_JSON).unwrap());
    }
    let txt = fs::read_to_string(&p).map_err(|e| e.to_string())?;
    serde_json::from_str(&txt).map_err(|e| format!("meta.json is not valid JSON ({})", e))
}

fn write_meta(ws: &Path, meta: &Value) -> Result<(), String> {
    let bytes = serde_json::to_vec_pretty(meta).map_err(|e| e.to_string())?;
    atomic_write(&meta_path(ws), &bytes)
}

fn backup_timestamp() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    format!("{}", secs)
}

/// Copy critical legacy files into `.backups/<timestamp>/` before migration.
pub fn backup_workspace_critical(ws: &Path) -> Result<PathBuf, String> {
    let stamp = backup_timestamp();
    let dest = ws.join(".backups").join(&stamp);
    fs::create_dir_all(&dest).map_err(|e| format!("mkdir backup: {}", e))?;

    let copy_if = |rel: &str| -> Result<(), String> {
        let src = ws.join(rel);
        if !src.exists() {
            return Ok(());
        }
        // Preserve nested paths (e.g. job_scraper/seen_jobs.json) in the backup tree.
        if let Some(parent) = Path::new(rel).parent() {
            if !parent.as_os_str().is_empty() {
                fs::create_dir_all(dest.join(parent))
                    .map_err(|e| format!("mkdir backup {}: {}", parent.display(), e))?;
            }
        }
        let nested = dest.join(rel);
        fs::copy(&src, &nested).map_err(|e| format!("backup {}: {}", rel, e))?;
        Ok(())
    };

    copy_if("job_search_tracker.csv")?;
    copy_if("job_scraper/seen_jobs.json")?;
    copy_if("CLAUDE.md")?;
    Ok(dest)
}

const CRITICAL_BACKUP_RELS: [&str; 3] = [
    "job_search_tracker.csv",
    "job_scraper/seen_jobs.json",
    "CLAUDE.md",
];

/// Resolve `ws/.backups/<backup_folder_name>` and refuse path escape.
fn resolve_backup_dir(ws: &Path, backup_folder_name: &str) -> Result<PathBuf, String> {
    let name = backup_folder_name.trim();
    if name.is_empty() {
        return Err("backup folder name is empty".into());
    }
    let p = Path::new(name);
    if p.is_absolute()
        || p.components().count() != 1
        || p.components()
            .any(|c| matches!(c, Component::ParentDir | Component::Prefix(_)))
    {
        return Err(format!(
            "refusing backup path outside .backups: {}",
            backup_folder_name
        ));
    }
    let backups_root = ws.join(".backups");
    let backup_dir = backups_root.join(name);
    // Soft confinement: joined path must stay under .backups (no unexpected absolute rewrite).
    if !backup_dir.starts_with(&backups_root) {
        return Err(format!(
            "refusing backup path outside .backups: {}",
            backup_folder_name
        ));
    }
    if !backup_dir.is_dir() {
        return Err(format!("backup not found: .backups/{}", name));
    }
    Ok(backup_dir)
}

/// Restore critical files from `.backups/<backup_folder_name>/` into the workspace.
pub fn restore_workspace_backup(ws: &Path, backup_folder_name: &str) -> Result<Value, String> {
    let backup_dir = resolve_backup_dir(ws, backup_folder_name)?;
    let mut restored: Vec<String> = Vec::new();

    for rel in CRITICAL_BACKUP_RELS {
        let src = backup_dir.join(rel);
        if !src.is_file() {
            continue;
        }
        let dest = ws.join(rel);
        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("mkdir {}: {}", parent.display(), e))?;
        }
        fs::copy(&src, &dest).map_err(|e| format!("restore {}: {}", rel, e))?;
        restored.push(rel.to_string());
    }

    if restored.is_empty() {
        return Err(format!(
            "backup .backups/{} has no critical files to restore",
            backup_folder_name.trim()
        ));
    }

    Ok(serde_json::json!({
        "restored": true,
        "backup": format!(".backups/{}", backup_folder_name.trim()),
        "files": restored
    }))
}

fn write_tracker_rows(ws: &Path, header: &[String], rows: &[TrackerRow]) -> Result<(), String> {
    let mut wtr = csv::WriterBuilder::new()
        .quote_style(csv::QuoteStyle::Necessary)
        .from_writer(vec![]);
    wtr.write_record(header).map_err(|e| e.to_string())?;
    for r in rows {
        let rec: Vec<String> = header
            .iter()
            .map(|h| r.fields.get(h).cloned().unwrap_or_default())
            .collect();
        wtr.write_record(&rec).map_err(|e| e.to_string())?;
    }
    let bytes = wtr.into_inner().map_err(|e| e.to_string())?;
    atomic_write(&tracker_path(ws), &bytes)
}

/// Append a tracker row (status defaults to `drafted`) and emit `draft_created`.
pub fn add_tracker_row(
    ws: &Path,
    mut fields: BTreeMap<String, String>,
    today: &str,
) -> Result<TrackerRow, String> {
    let status = fields
        .get("status")
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "drafted".into());
    let status = canonical_status(&status);
    if !STATUSES.contains(&status.as_str()) {
        return Err(format!("'{}' is not a canonical tracker status", status));
    }
    fields.insert("status".into(), status.clone());
    if fields.get("date").map(|s| s.trim().is_empty()).unwrap_or(true) {
        fields.insert("date".into(), today.to_string());
    }

    let mut t = read_tracker(ws)?;
    let header = if t.header.is_empty() {
        TRACKER_HEADER.iter().map(|s| s.to_string()).collect()
    } else {
        t.header.clone()
    };
    // Ensure header file exists even when tracker was missing.
    if !t.exists {
        t.header = header.clone();
    }
    let index = t.rows.len();
    let row = TrackerRow {
        index,
        fields: {
            let mut complete = BTreeMap::new();
            for h in &header {
                complete.insert(
                    h.clone(),
                    fields.get(h).cloned().unwrap_or_default(),
                );
            }
            // Preserve any extra keys the caller passed that aren't in the header.
            for (k, v) in &fields {
                complete.entry(k.clone()).or_insert_with(|| v.clone());
            }
            complete
        },
    };
    t.rows.push(row.clone());
    write_tracker_rows(ws, &header, &t.rows)?;

    let company = row.fields.get("company").map(|s| s.as_str()).unwrap_or("");
    let role = row.fields.get("role").map(|s| s.as_str()).unwrap_or("");
    let _ = append_application_event(ws, company, role, "draft_created", "", today);
    let _ = write_application_stub(ws, &row, today);

    Ok(row)
}

fn application_id(company: &str, role: &str) -> String {
    let name = folder_name(company, role);
    if name.is_empty() {
        format!("app_{}", uuid::Uuid::new_v4())
    } else {
        name
    }
}

/// Write/update a canonical `applications/<id>/application.json` stub + events line.
fn write_application_stub(ws: &Path, row: &TrackerRow, today: &str) -> Result<(), String> {
    let company = row.fields.get("company").map(|s| s.as_str()).unwrap_or("");
    let role = row.fields.get("role").map(|s| s.as_str()).unwrap_or("");
    let id = application_id(company, role);
    let dir = ws.join("applications").join(&id);
    fs::create_dir_all(dir.join("documents")).map_err(|e| e.to_string())?;
    let app_path = dir.join("application.json");
    let stub = serde_json::json!({
        "id": id,
        "company": company,
        "role": role,
        "status": row.fields.get("status").cloned().unwrap_or_else(|| "drafted".into()),
        "tracker_index": row.index,
        "source": row.fields.get("source").cloned().unwrap_or_default(),
        "date": row.fields.get("date").cloned().unwrap_or_else(|| today.to_string()),
        "fields": row.fields,
    });
    if !app_path.exists() {
        let bytes = serde_json::to_vec_pretty(&stub).map_err(|e| e.to_string())?;
        atomic_write(&app_path, &bytes)?;
    }
    let events = dir.join("events.jsonl");
    if !events.exists() {
        use std::io::Write;
        let line = serde_json::json!({
            "ts": today,
            "type": "draft_created",
            "detail": "",
        });
        let mut f = fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(&events)
            .map_err(|e| e.to_string())?;
        writeln!(f, "{}", line).map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Add or update an entry in `job_scraper/seen_jobs.json`.
///
/// Sets/preserves `first_seen`, refreshes `last_verified`, and records
/// `source_url` / provenance flags (`user_entered`, `manual`).
pub fn upsert_seen_job(ws: &Path, job: Value) -> Result<Value, String> {
    let p = seen_jobs_path(ws);
    if let Some(parent) = p.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("mkdir job_scraper: {}", e))?;
    }

    let mut root: Value = if p.exists() {
        let txt = fs::read_to_string(&p).map_err(|e| e.to_string())?;
        serde_json::from_str(&txt).map_err(|e| {
            format!(
                "seen_jobs.json is not valid JSON ({}); it may be mid-write",
                e
            )
        })?
    } else {
        serde_json::json!({"seen": {}})
    };

    let seen = root
        .as_object_mut()
        .ok_or("seen_jobs.json root must be an object")?
        .entry("seen".to_string())
        .or_insert_with(|| serde_json::json!({}));
    let seen_obj = seen
        .as_object_mut()
        .ok_or("seen_jobs.json \"seen\" must be an object")?;

    let key = job
        .get("key")
        .and_then(|v| v.as_str())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string())
        .or_else(|| {
            job.get("url")
                .and_then(|v| v.as_str())
                .filter(|s| !s.is_empty())
                .map(|s| s.to_string())
        })
        .or_else(|| {
            let company = job.get("company").and_then(|v| v.as_str()).unwrap_or("");
            let title = job
                .get("title")
                .or_else(|| job.get("role"))
                .and_then(|v| v.as_str())
                .unwrap_or("");
            let name = folder_name(company, title);
            if name.is_empty() {
                None
            } else {
                Some(name)
            }
        })
        .ok_or_else(|| "job json needs key, url, or company+title".to_string())?;

    let prior_first_seen = seen_obj
        .get(&key)
        .and_then(|e| e.get("first_seen"))
        .cloned();

    let mut entry = seen_obj.get(&key).cloned().unwrap_or_else(|| serde_json::json!({}));
    let entry_obj = entry
        .as_object_mut()
        .ok_or("existing seen job entry is not an object")?;

    // Merge incoming fields (except key / managed timestamps handled below).
    if let Some(obj) = job.as_object() {
        for (k, v) in obj {
            if k == "key" {
                continue;
            }
            entry_obj.insert(k.clone(), v.clone());
        }
    }

    // Preserve original first_seen across updates.
    if let Some(fs) = prior_first_seen {
        entry_obj.insert("first_seen".into(), fs);
    } else if !entry_obj.contains_key("first_seen") {
        if let Some(fs) = job
            .get("last_verified")
            .or_else(|| job.get("first_seen"))
            .and_then(|v| v.as_str())
        {
            entry_obj.insert("first_seen".into(), Value::String(fs.to_string()));
        }
    }

    let source_url = entry_obj
        .get("source_url")
        .and_then(|v| v.as_str())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string())
        .or_else(|| {
            entry_obj
                .get("url")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string())
        });
    if let Some(url) = source_url {
        entry_obj.insert("source_url".into(), Value::String(url));
    }

    if !entry_obj.contains_key("last_verified") {
        if let Some(fs) = entry_obj.get("first_seen").and_then(|v| v.as_str()) {
            entry_obj.insert("last_verified".into(), Value::String(fs.to_string()));
        }
    }

    // Provenance flags for manual / user-entered jobs.
    if !entry_obj.contains_key("user_entered") {
        entry_obj.insert("user_entered".into(), Value::Bool(true));
    }
    if !entry_obj.contains_key("manual") {
        entry_obj.insert("manual".into(), Value::Bool(true));
    }
    if !entry_obj.contains_key("provenance") {
        entry_obj.insert(
            "provenance".into(),
            serde_json::json!({
                "source": "manual",
                "user_entered": true
            }),
        );
    }

    seen_obj.insert(key.clone(), entry.clone());
    let bytes = serde_json::to_vec_pretty(&root).map_err(|e| e.to_string())?;
    atomic_write(&p, &bytes)?;

    if let Some(o) = entry.as_object_mut() {
        o.insert("key".into(), Value::String(key));
    }
    Ok(entry)
}

/// One-shot legacy → canonical migration. Idempotent when `schema_version >= 2`.
pub fn migrate_legacy_to_canonical(ws: &Path) -> Result<Value, String> {
    let mut meta = read_meta(ws)?;
    let version = meta
        .get("schema_version")
        .and_then(|v| v.as_u64())
        .unwrap_or(1);
    if version >= 2 {
        return Ok(serde_json::json!({
            "migrated": false,
            "already_current": true,
            "schema_version": version,
            "backup": Value::Null,
            "applications_written": 0
        }));
    }

    let backup = backup_workspace_critical(ws)?;
    let backup_rel = backup
        .strip_prefix(ws)
        .unwrap_or(&backup)
        .to_string_lossy()
        .to_string();

    let tracker = read_tracker(ws)?;
    let mut written = 0usize;
    let today = backup_timestamp(); // stable-ish stamp for stub dates when missing
    for row in &tracker.rows {
        write_application_stub(ws, row, &today)?;
        written += 1;
    }

    if let Some(obj) = meta.as_object_mut() {
        obj.insert("schema_version".into(), Value::from(2u64));
        obj.insert("migrated_at".into(), Value::String(chrono_like_now()));
    }
    write_meta(ws, &meta)?;

    Ok(serde_json::json!({
        "migrated": true,
        "already_current": false,
        "schema_version": 2,
        "backup": backup_rel,
        "applications_written": written
    }))
}

fn chrono_like_now() -> String {
    // Portable ISO-ish UTC second stamp without a chrono dependency.
    use std::time::{SystemTime, UNIX_EPOCH};
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    format!("{}", secs)
}

/// Ensure `ws` is a usable job-search workspace. Creates missing starter files only —
/// never overwrites existing content. Returns the relative paths that were created.
pub fn ensure_workspace(ws: &Path) -> Result<Vec<String>, String> {
    if !ws.exists() {
        fs::create_dir_all(ws).map_err(|e| format!("could not create folder {}: {}", ws.display(), e))?;
    }
    if !ws.is_dir() {
        return Err(format!("{} is not a folder", ws.display()));
    }

    let mut created = Vec::new();

    let mkdir = |rel: &str, created: &mut Vec<String>| -> Result<(), String> {
        let p = ws.join(rel);
        if !p.exists() {
            fs::create_dir_all(&p).map_err(|e| format!("mkdir {}: {}", rel, e))?;
            created.push(rel.to_string());
        }
        Ok(())
    };

    let write_new = |rel: &str, body: &str, created: &mut Vec<String>| -> Result<(), String> {
        let p = ws.join(rel);
        if let Some(parent) = p.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("mkdir {}: {}", parent.display(), e))?;
        }
        if !p.exists() {
            fs::write(&p, body).map_err(|e| format!("write {}: {}", rel, e))?;
            created.push(rel.to_string());
        }
        Ok(())
    };

    for dir in [
        ".claude/commands",
        ".claude/skills/job-application-assistant",
        ".claude/skills/job-scraper",
        "job_scraper",
        "documents/applications",
        "cv",
        "cover_letters",
        "company_research",
        "templates",
        "tools",
        "candidate",
        "candidate/resume_artifacts",
        "jobs",
        "applications",
        ".backups",
    ] {
        mkdir(dir, &mut created)?;
    }

    write_new("meta.json", SCAFFOLD_META_JSON, &mut created)?;
    write_new("tools/posting_guard.py", SCAFFOLD_POSTING_GUARD, &mut created)?;
    write_new("CLAUDE.md", SCAFFOLD_CLAUDE_MD, &mut created)?;
    write_new("AGENTS.md", SCAFFOLD_AGENTS_MD, &mut created)?;
    write_new(
        "job_search_tracker.csv",
        &(TRACKER_HEADER.join(",") + "\n"),
        &mut created,
    )?;
    write_new("job_scraper/seen_jobs.json", "{\"seen\":{}}\n", &mut created)?;
    write_new(
        ".claude/skills/job-application-assistant/01-candidate-profile.md",
        SCAFFOLD_PROFILE_STUB,
        &mut created,
    )?;
    write_new(
        ".claude/skills/job-application-assistant/02-behavioral-profile.md",
        SCAFFOLD_PROFILE_STUB,
        &mut created,
    )?;
    write_new(
        ".claude/skills/job-application-assistant/03-writing-style.md",
        SCAFFOLD_PROFILE_STUB,
        &mut created,
    )?;
    write_new(
        ".claude/skills/job-application-assistant/04-job-evaluation.md",
        SCAFFOLD_PROFILE_STUB,
        &mut created,
    )?;
    write_new(
        ".claude/skills/job-application-assistant/05-cv-templates.md",
        SCAFFOLD_PROFILE_STUB,
        &mut created,
    )?;
    write_new(
        ".claude/skills/job-application-assistant/06-cover-letter-templates.md",
        SCAFFOLD_PROFILE_STUB,
        &mut created,
    )?;
    write_new(
        ".claude/skills/job-application-assistant/07-interview-prep.md",
        SCAFFOLD_PROFILE_STUB,
        &mut created,
    )?;
    write_new(
        ".claude/skills/job-scraper/search-queries.md",
        SCAFFOLD_SEARCH_QUERIES,
        &mut created,
    )?;
    write_new(".claude/commands/setup.md", SCAFFOLD_SETUP_CMD, &mut created)?;
    write_new(".claude/commands/rank.md", SCAFFOLD_RANK_CMD, &mut created)?;
    write_new(".claude/commands/apply.md", SCAFFOLD_APPLY_CMD, &mut created)?;

    Ok(created)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn ws_with_tracker(body: &str) -> tempfile::TempDir {
        let d = tempfile::tempdir().unwrap();
        fs::write(d.path().join("job_search_tracker.csv"), body).unwrap();
        d
    }
    const H: &str = "date,company,sector,role,role_type,channel,status,contact_person,fit_rating,notes,cv_file,cover_letter_file,source,deadline\n";

    #[test]
    fn folder_naming_matches_upstream_rule() {
        assert_eq!(folder_name("Novo Nordisk A/S", "ML Engineer"), "novo_nordisk_as_ml_engineer");
        assert_eq!(folder_name("ClickUp", "Staff Frontend Engineer"), "clickup_staff_frontend_engineer");
        assert_eq!(folder_name("  __", "!!"), "");
    }

    #[test]
    fn status_update_round_trips_and_preserves_columns() {
        let d = ws_with_tracker(&format!("{}2026-11-01,Acme,,Dev,,online,drafted,,80,first note,cv/a.tex,cover_letters/a.tex,https://x.test/1,2026-12-01\n", H));
        let r = update_status(d.path(), 0, "drafted", "applied", "sent via portal, today", "2026-11-19").unwrap();
        assert_eq!(r.fields["status"], "applied");
        // Original application date must be preserved (BUG-04).
        assert_eq!(r.fields["date"], "2026-11-01");
        assert_eq!(r.fields["deadline"], "2026-12-01");
        assert_eq!(r.fields["notes"], "first note; 2026-11-19 sent via portal today");
        let t = read_tracker(d.path()).unwrap();
        assert_eq!(t.rows[0].fields["cv_file"], "cv/a.tex");
        assert_eq!(t.rows[0].fields["source"], "https://x.test/1");
        let events = fs::read_to_string(
            d.path()
                .join("documents/applications/acme_dev/events.jsonl"),
        )
        .unwrap();
        assert!(events.contains("user_confirmed_submitted"));
    }

    #[test]
    fn relative_path_rejected_by_resolve_semantics() {
        // ensure_workspace itself still scaffolds absolute temp dirs; relative
        // rejection lives in set_workspace (lib). Guard that scaffold never
        // runs against a non-dir file.
        let d = tempfile::tempdir().unwrap();
        let f = d.path().join("not-a-dir");
        fs::write(&f, "x").unwrap();
        assert!(ensure_workspace(&f).is_err());
    }

    #[test]
    fn rejects_noncanonical_and_stale_and_reopen() {
        let d = ws_with_tracker(&format!("{}2026-11-01,Acme,,Dev,,,rejected,,,,,,,\n", H));
        assert!(update_status(d.path(), 0, "rejected", "maybe", "", "2026-11-19").is_err());
        assert!(update_status(d.path(), 0, "applied", "interview", "", "2026-11-19").is_err());
        assert!(update_status(d.path(), 0, "rejected", "interview", "", "2026-11-19").is_err());
    }

    #[test]
    fn legacy_spellings_canonicalised() {
        assert_eq!(canonical_status("No Response"), "no_response");
        assert_eq!(canonical_status("offer declined"), "offer_declined");
    }

    #[test]
    fn safe_join_blocks_traversal() {
        let d = tempfile::tempdir().unwrap();
        assert!(safe_join(d.path(), "../etc/passwd").is_err());
        assert!(safe_join(d.path(), "/etc/passwd").is_err());
        assert!(safe_join(d.path(), "cv/main.tex").is_ok());
    }

    #[test]
    fn seen_jobs_parse_and_bad_json_reported() {
        let d = tempfile::tempdir().unwrap();
        fs::create_dir_all(d.path().join("job_scraper")).unwrap();
        fs::write(d.path().join("job_scraper/seen_jobs.json"), r#"{"seen":{"k1":{"title":"T","company":"C","fit":"high"}}}"#).unwrap();
        let v = read_seen(d.path()).unwrap();
        assert_eq!(v[0]["key"], "k1");
        fs::write(d.path().join("job_scraper/seen_jobs.json"), "{\"seen\":").unwrap();
        assert!(read_seen(d.path()).is_err());
    }

    #[test]
    fn notes_never_contain_commas() {
        assert_eq!(sanitize_note("a, \"b\"\nc"), "a b c");
    }

    #[test]
    fn ensure_workspace_scaffolds_empty_folder_once() {
        let d = tempfile::tempdir().unwrap();
        let created = ensure_workspace(d.path()).unwrap();
        assert!(created.iter().any(|p| p == "CLAUDE.md"));
        assert!(created.iter().any(|p| p == "meta.json"));
        assert!(created.iter().any(|p| p == "tools/posting_guard.py"));
        assert!(d.path().join("CLAUDE.md").exists());
        assert!(d.path().join("meta.json").exists());
        assert!(d.path().join("tools/posting_guard.py").exists());
        assert!(d.path().join(".claude/commands").is_dir());
        assert!(d.path().join("job_search_tracker.csv").exists());
        let again = ensure_workspace(d.path()).unwrap();
        assert!(again.is_empty(), "second pass must not overwrite: {:?}", again);
        let original = fs::read_to_string(d.path().join("CLAUDE.md")).unwrap();
        fs::write(d.path().join("CLAUDE.md"), "custom").unwrap();
        let _ = ensure_workspace(d.path()).unwrap();
        assert_eq!(fs::read_to_string(d.path().join("CLAUDE.md")).unwrap(), "custom");
        assert!(original.contains("[YOUR_NAME]"));
    }

    #[test]
    fn add_tracker_row_defaults_drafted_and_emits_event() {
        let d = tempfile::tempdir().unwrap();
        ensure_workspace(d.path()).unwrap();
        let mut fields = BTreeMap::new();
        fields.insert("company".into(), "Acme".into());
        fields.insert("role".into(), "Dev".into());
        fields.insert("source".into(), "https://example.com/jobs/1".into());
        let row = add_tracker_row(d.path(), fields, "2026-11-21").unwrap();
        assert_eq!(row.index, 0);
        assert_eq!(row.fields["status"], "drafted");
        assert_eq!(row.fields["date"], "2026-11-21");
        assert_eq!(row.fields["company"], "Acme");
        let t = read_tracker(d.path()).unwrap();
        assert_eq!(t.rows.len(), 1);
        let events = fs::read_to_string(
            d.path()
                .join("documents/applications/acme_dev/events.jsonl"),
        )
        .unwrap();
        assert!(events.contains("draft_created"));
        assert!(d
            .path()
            .join("applications/acme_dev/application.json")
            .is_file());
    }

    #[test]
    fn migrate_backs_up_and_is_idempotent() {
        let d = tempfile::tempdir().unwrap();
        ensure_workspace(d.path()).unwrap();
        fs::write(
            d.path().join("CLAUDE.md"),
            "# custom profile\n",
        )
        .unwrap();
        let mut fields = BTreeMap::new();
        fields.insert("company".into(), "Beta".into());
        fields.insert("role".into(), "Eng".into());
        add_tracker_row(d.path(), fields, "2026-11-20").unwrap();

        let first = migrate_legacy_to_canonical(d.path()).unwrap();
        assert_eq!(first["migrated"], true);
        assert_eq!(first["schema_version"], 2);
        assert_eq!(first["applications_written"], 1);
        let backup = first["backup"].as_str().unwrap();
        assert!(d.path().join(backup).join("job_search_tracker.csv").is_file());
        assert!(d.path().join(backup).join("CLAUDE.md").is_file());
        assert!(d
            .path()
            .join(backup)
            .join("job_scraper/seen_jobs.json")
            .is_file());
        assert!(d
            .path()
            .join("applications/beta_eng/application.json")
            .is_file());

        let meta: Value =
            serde_json::from_str(&fs::read_to_string(d.path().join("meta.json")).unwrap()).unwrap();
        assert_eq!(meta["schema_version"], 2);
        assert!(meta.get("migrated_at").is_some());

        let second = migrate_legacy_to_canonical(d.path()).unwrap();
        assert_eq!(second["migrated"], false);
        assert_eq!(second["already_current"], true);
        assert_eq!(second["schema_version"], 2);
    }

    #[test]
    fn migrate_creates_backup_and_restore_brings_tracker_back() {
        let d = tempfile::tempdir().unwrap();
        ensure_workspace(d.path()).unwrap();
        let mut fields = BTreeMap::new();
        fields.insert("company".into(), "Gamma".into());
        fields.insert("role".into(), "Dev".into());
        add_tracker_row(d.path(), fields, "2026-11-20").unwrap();

        let first = migrate_legacy_to_canonical(d.path()).unwrap();
        assert_eq!(first["migrated"], true);
        let backup = first["backup"].as_str().unwrap();
        let folder_name = Path::new(backup)
            .file_name()
            .unwrap()
            .to_string_lossy()
            .to_string();
        let original = fs::read_to_string(d.path().join("job_search_tracker.csv")).unwrap();

        fs::write(
            d.path().join("job_search_tracker.csv"),
            "date,company,sector,role,role_type,channel,status,contact_person,fit_rating,notes,cv_file,cover_letter_file,source,deadline\n",
        )
        .unwrap();
        let wiped = fs::read_to_string(d.path().join("job_search_tracker.csv")).unwrap();
        assert_ne!(wiped, original);

        let restored = restore_workspace_backup(d.path(), &folder_name).unwrap();
        assert_eq!(restored["restored"], true);
        let after = fs::read_to_string(d.path().join("job_search_tracker.csv")).unwrap();
        assert_eq!(after, original);
        assert!(after.contains("Gamma"));

        assert!(restore_workspace_backup(d.path(), "../etc").is_err());
        assert!(restore_workspace_backup(d.path(), "missing-backup").is_err());
    }

    #[test]
    fn upsert_seen_job_preserves_first_seen() {
        let d = tempfile::tempdir().unwrap();
        ensure_workspace(d.path()).unwrap();
        let first = upsert_seen_job(
            d.path(),
            serde_json::json!({
                "key": "job-1",
                "title": "Dev",
                "company": "Acme",
                "url": "https://example.com/1",
                "first_seen": "2026-11-01",
                "last_verified": "2026-11-01"
            }),
        )
        .unwrap();
        assert_eq!(first["first_seen"], "2026-11-01");
        assert_eq!(first["source_url"], "https://example.com/1");
        assert_eq!(first["user_entered"], true);

        let second = upsert_seen_job(
            d.path(),
            serde_json::json!({
                "key": "job-1",
                "title": "Dev Updated",
                "last_verified": "2026-11-21"
            }),
        )
        .unwrap();
        assert_eq!(second["first_seen"], "2026-11-01");
        assert_eq!(second["last_verified"], "2026-11-21");
        assert_eq!(second["title"], "Dev Updated");
    }
}
