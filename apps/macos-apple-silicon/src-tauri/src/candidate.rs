//! Offline candidate profile store (`candidate/profile.json`).
//! Native core path — no AI. Used by Profile form + ATS parse confirm flow.

use serde_json::{json, Value};
use std::fs;
use std::path::Path;

use crate::workspace;

fn profile_path(ws: &Path) -> std::path::PathBuf {
    ws.join("candidate/profile.json")
}

fn empty_profile() -> Value {
    json!({
        "schema_version": 1,
        "name": "",
        "headline": "",
        "email": "",
        "phone": "",
        "location": "",
        "workAuthorization": "unknown",
        "preferences": {
            "countries": [],
            "remote": null
        },
        "facts": [],
        "updatedAt": ""
    })
}

pub fn read_candidate_profile(ws: &Path) -> Result<Value, String> {
    let p = profile_path(ws);
    if !p.exists() {
        return Ok(empty_profile());
    }
    let txt = fs::read_to_string(&p).map_err(|e| format!("read profile: {e}"))?;
    serde_json::from_str(&txt).map_err(|e| format!("profile.json is not valid JSON ({e})"))
}

pub fn write_candidate_profile(ws: &Path, profile: &Value) -> Result<Value, String> {
    let dir = ws.join("candidate");
    fs::create_dir_all(&dir).map_err(|e| format!("mkdir candidate: {e}"))?;
    let mut out = profile.clone();
    if let Some(obj) = out.as_object_mut() {
        if !obj.contains_key("schema_version") {
            obj.insert("schema_version".into(), json!(1));
        }
        obj.insert("updatedAt".into(), json!(chrono_like_now()));
    }
    let bytes = serde_json::to_vec_pretty(&out).map_err(|e| e.to_string())?;
    workspace::atomic_write(&profile_path(ws), &bytes)?;
    Ok(out)
}

fn chrono_like_now() -> String {
    // Avoid chrono dependency — ISO-ish UTC via date(1).
    std::process::Command::new("/bin/date")
        .arg("-u")
        .arg("+%Y-%m-%dT%H:%M:%S.000Z")
        .output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "1970-01-01T00:00:00.000Z".into())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn round_trip_profile() {
        let d = TempDir::new().unwrap();
        let written = write_candidate_profile(
            d.path(),
            &json!({"name": "Alex", "facts": [], "preferences": {"countries": ["DE"], "remote": true}}),
        )
        .unwrap();
        assert_eq!(written["name"], "Alex");
        let read = read_candidate_profile(d.path()).unwrap();
        assert_eq!(read["name"], "Alex");
    }
}
