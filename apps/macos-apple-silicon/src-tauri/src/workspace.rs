//! Typed, read-mostly adapters over the upstream workspace files.
//!
//! The upstream files stay authoritative and keep their exact formats. The only
//! writes here are the ones `/outcome` Step 4 defines for a status change:
//! `status`, `notes` (comma-free dated note) and, when leaving `drafted`, `date`.
//! Writes are atomic (temp file + rename) and preserve every other column.

use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::BTreeMap;
use std::fs;
use std::path::{Component, Path, PathBuf};

pub const TRACKER_HEADER: [&str; 14] = [
    "date",
    "company",
    "sector",
    "role",
    "role_type",
    "channel",
    "status",
    "contact_person",
    "fit_rating",
    "notes",
    "cv_file",
    "cover_letter_file",
    "source",
    "deadline",
];
pub const STATUSES: [&str; 9] = [
    "drafted",
    "applied",
    "interview",
    "offer",
    "hired",
    "rejected",
    "no_response",
    "offer_declined",
    "withdrawn",
];
pub const FINAL: [&str; 5] = [
    "hired",
    "rejected",
    "no_response",
    "offer_declined",
    "withdrawn",
];

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
        return Ok(Tracker {
            header: TRACKER_HEADER.iter().map(|s| s.to_string()).collect(),
            rows: vec![],
            exists: false,
        });
    }
    let mut rdr = csv::ReaderBuilder::new()
        .flexible(true)
        .from_path(&p)
        .map_err(|e| e.to_string())?;
    let header: Vec<String> = rdr
        .headers()
        .map_err(|e| e.to_string())?
        .iter()
        .map(|s| s.to_string())
        .collect();
    let mut rows = vec![];
    for (i, rec) in rdr.records().enumerate() {
        let rec = rec.map_err(|e| format!("tracker row {}: {}", i + 2, e))?;
        let mut fields = BTreeMap::new();
        for (j, h) in header.iter().enumerate() {
            fields.insert(h.clone(), rec.get(j).unwrap_or("").to_string());
        }
        rows.push(TrackerRow { index: i, fields });
    }
    Ok(Tracker {
        header,
        rows,
        exists: true,
    })
}

pub fn sanitize_note(s: &str) -> String {
    s.replace([',', '"', '\n', '\r'], " ")
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

pub fn atomic_write(path: &Path, bytes: &[u8]) -> Result<(), String> {
    let dir = path.parent().ok_or("no parent dir")?;
    let tmp = dir.join(format!(
        ".{}.tmp-{}",
        path.file_name().unwrap().to_string_lossy(),
        uuid::Uuid::new_v4()
    ));
    fs::write(&tmp, bytes).map_err(|e| e.to_string())?;
    fs::rename(&tmp, path).map_err(|e| e.to_string())
}

/// Status change per `/outcome` Step 4. `expected_status` guards against a
/// concurrent write by Claude Code between the UI read and this write.
pub fn update_status(
    ws: &Path,
    index: usize,
    expected_status: &str,
    new_status: &str,
    note: &str,
    today: &str,
) -> Result<TrackerRow, String> {
    let new_status = canonical_status(new_status);
    if !STATUSES.contains(&new_status.as_str()) {
        return Err(format!(
            "'{}' is not a canonical tracker status",
            new_status
        ));
    }
    let t = read_tracker(ws)?;
    if !t.exists {
        return Err("job_search_tracker.csv does not exist".into());
    }
    let mut rows = t.rows;
    let row = rows.get_mut(index).ok_or("row not found")?;
    let cur = canonical_status(row.fields.get("status").map(|s| s.as_str()).unwrap_or(""));
    if cur != canonical_status(expected_status) {
        return Err(format!(
            "The tracker changed on disk (status is now '{}'). Reload and try again.",
            cur
        ));
    }
    if FINAL.contains(&cur.as_str()) && cur != new_status {
        return Err(format!("'{}' is a final status; upstream never reopens a closed application. Record a new application instead.", cur));
    }
    if cur == "drafted" && new_status != "drafted" && new_status != "withdrawn" {
        row.fields.insert("date".into(), today.to_string());
    }
    row.fields.insert("status".into(), new_status.clone());
    let note = sanitize_note(note);
    let entry = if note.is_empty() {
        format!("{} {}", today, new_status)
    } else {
        format!("{} {}", today, note)
    };
    let notes = row.fields.get("notes").cloned().unwrap_or_default();
    row.fields.insert(
        "notes".into(),
        if notes.trim().is_empty() {
            entry
        } else {
            format!("{}; {}", notes, entry)
        },
    );
    let updated = row.clone();

    let mut wtr = csv::WriterBuilder::new()
        .quote_style(csv::QuoteStyle::Necessary)
        .from_writer(vec![]);
    wtr.write_record(&t.header).map_err(|e| e.to_string())?;
    for r in &rows {
        let rec: Vec<String> = t
            .header
            .iter()
            .map(|h| r.fields.get(h).cloned().unwrap_or_default())
            .collect();
        wtr.write_record(&rec).map_err(|e| e.to_string())?;
    }
    let bytes = wtr.into_inner().map_err(|e| e.to_string())?;
    atomic_write(&tracker_path(ws), &bytes)?;
    Ok(updated)
}

pub fn read_seen(ws: &Path) -> Result<Vec<Value>, String> {
    let p = ws.join("job_scraper/seen_jobs.json");
    if !p.exists() {
        return Ok(vec![]);
    }
    let txt = fs::read_to_string(&p).map_err(|e| e.to_string())?;
    let v: Value = serde_json::from_str(&txt).map_err(|e| {
        format!(
            "seen_jobs.json is not valid JSON ({}); it may be mid-write",
            e
        )
    })?;
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
    let raw = format!("{}_{}", company, role)
        .to_lowercase()
        .replace(' ', "_");
    let kept: String = raw
        .chars()
        .filter(|c| c.is_ascii_alphanumeric() || *c == '_')
        .collect();
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
    if p.is_absolute()
        || p.components()
            .any(|c| matches!(c, Component::ParentDir | Component::Prefix(_)))
    {
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
            Some(ProfileFile {
                path: rel.to_string(),
                content,
                placeholders,
            })
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
        assert_eq!(
            folder_name("Novo Nordisk A/S", "ML Engineer"),
            "novo_nordisk_as_ml_engineer"
        );
        assert_eq!(
            folder_name("ClickUp", "Staff Frontend Engineer"),
            "clickup_staff_frontend_engineer"
        );
        assert_eq!(folder_name("  __", "!!"), "");
    }

    #[test]
    fn status_update_round_trips_and_preserves_columns() {
        let d = ws_with_tracker(&format!("{}2026-11-01,Acme,,Dev,,online,drafted,,80,first note,cv/a.tex,cover_letters/a.tex,https://x.test/1,2026-12-01\n", H));
        let r = update_status(
            d.path(),
            0,
            "drafted",
            "applied",
            "sent via portal, today",
            "2026-11-19",
        )
        .unwrap();
        assert_eq!(r.fields["status"], "applied");
        assert_eq!(r.fields["date"], "2026-11-19");
        assert_eq!(r.fields["deadline"], "2026-12-01");
        assert_eq!(
            r.fields["notes"],
            "first note; 2026-11-19 sent via portal today"
        );
        let t = read_tracker(d.path()).unwrap();
        assert_eq!(t.rows[0].fields["cv_file"], "cv/a.tex");
        assert_eq!(t.rows[0].fields["source"], "https://x.test/1");
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
        fs::write(
            d.path().join("job_scraper/seen_jobs.json"),
            r#"{"seen":{"k1":{"title":"T","company":"C","fit":"high"}}}"#,
        )
        .unwrap();
        let v = read_seen(d.path()).unwrap();
        assert_eq!(v[0]["key"], "k1");
        fs::write(d.path().join("job_scraper/seen_jobs.json"), "{\"seen\":").unwrap();
        assert!(read_seen(d.path()).is_err());
    }

    #[test]
    fn notes_never_contain_commas() {
        assert_eq!(sanitize_note("a, \"b\"\nc"), "a b c");
    }
}
