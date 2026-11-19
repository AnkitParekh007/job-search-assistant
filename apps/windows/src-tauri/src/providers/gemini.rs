//! Google Gemini — CLI (agentic/headless) and Developer API (BYOK inference).
//!
//! Modes are distinct: a consumer Gemini subscription does not imply API credits.
//! Headless CLI never uses unsafe auto-approval flags.

use super::inference::{InferenceBridge, InferenceOutcome, InferenceRequest, StreamFn};
use super::types::{ProviderCapability, ProviderId, ProviderStatus};
use crate::db::{Db, RunSummary};
use crate::env;
use crate::security::credentials::{self, CredentialKind};
use serde_json::{json, Value};
use std::io::{BufRead, BufReader};
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tauri::AppHandle;

const DEFAULT_API_MODEL: &str = "gemini-2.0-flash";
const API_BASE: &str = "https://generativelanguage.googleapis.com/v1beta";

fn caps(cli: bool, api: bool) -> Vec<ProviderCapability> {
    [
        ("streaming", "Streaming", api || cli),
        ("structured", "Structured generation", true),
        ("cli", "Gemini CLI headless", cli),
        ("api", "Gemini Developer API", api),
        ("agentic", "CLI agentic (host-mediated)", cli),
        ("local", "On-device inference", false),
        ("byok", "API key in OS keychain", true),
    ]
    .iter()
    .map(|(id, label, supported)| ProviderCapability {
        id: (*id).into(),
        label: (*label).into(),
        supported: *supported,
    })
    .collect()
}

pub fn status() -> ProviderStatus {
    let bin = env::which("gemini");
    let cli = bin.is_some();
    let api = credentials::has_secret(CredentialKind::GeminiApi);
    let ver = bin.as_ref().and_then(|p| {
        Command::new(p)
            .arg("--version")
            .env("PATH", env::child_path())
            .output()
            .ok()
            .map(|o| {
                format!(
                    "{}{}",
                    String::from_utf8_lossy(&o.stdout),
                    String::from_utf8_lossy(&o.stderr)
                )
                .lines()
                .next()
                .unwrap_or("")
                .trim()
                .to_string()
            })
    });
    let detail = match (cli, api, ver) {
        (true, true, Some(v)) => format!("{v} · CLI + API key configured"),
        (true, false, Some(v)) => format!("{v} · CLI only (add API key for Developer API mode)"),
        (false, true, _) => "Gemini Developer API key stored · CLI not installed".into(),
        _ => "Not configured — install Gemini CLI and/or add a Developer API key".into(),
    };
    ProviderStatus {
        id: ProviderId::Gemini.as_str().into(),
        name: ProviderId::Gemini.display_name().into(),
        available: cli || api,
        authenticated: api || cli,
        detail,
        fix: "Install Gemini CLI (https://github.com/google-gemini/gemini-cli) and sign in, and/or create an API key at https://aistudio.google.com/apikey.".into(),
        planned: false,
        capabilities: caps(cli, api),
        models: vec![
            "gemini-2.0-flash".into(),
            "gemini-2.5-flash".into(),
            "gemini-2.5-pro".into(),
            "gemini-1.5-flash".into(),
            "gemini-1.5-pro".into(),
        ],
        default_model: Some(DEFAULT_API_MODEL.into()),
    }
}

fn agent() -> ureq::Agent {
    ureq::AgentBuilder::new()
        .timeout_connect(Duration::from_secs(15))
        .timeout_read(Duration::from_secs(180))
        .build()
}

fn api_key() -> Result<String, String> {
    credentials::load_secret(CredentialKind::GeminiApi)?
        .ok_or_else(|| "Gemini API key not configured. Add it in Settings → AI Providers.".into())
}

pub fn test_connection_api() -> Result<Value, String> {
    let key = api_key()?;
    let url = format!("{API_BASE}/models?key={}", urlencoding_lite(&key));
    let resp = agent().get(&url).call().map_err(map_err)?;
    let status = resp.status();
    if status == 401 || status == 403 {
        return Err("Gemini rejected the API key (401/403).".into());
    }
    if status == 429 {
        return Err("Gemini quota exceeded (429).".into());
    }
    if !(200..300).contains(&status) {
        return Err(format!("Gemini models probe failed with HTTP {status}"));
    }
    let body: Value = resp.into_json().map_err(|e| e.to_string())?;
    let count = body
        .get("models")
        .and_then(|m| m.as_array())
        .map(|a| a.len())
        .unwrap_or(0);
    Ok(json!({"ok": true, "models_visible": count, "mode": "api"}))
}

pub fn test_connection_cli() -> Result<Value, String> {
    let bin = env::which("gemini").ok_or("Gemini CLI not found")?;
    let out = Command::new(&bin)
        .args(["--version"])
        .env("PATH", env::child_path())
        .output()
        .map_err(|e| e.to_string())?;
    let ver = format!(
        "{}{}",
        String::from_utf8_lossy(&out.stdout),
        String::from_utf8_lossy(&out.stderr)
    );
    Ok(json!({
        "ok": out.status.success(),
        "mode": "cli",
        "version": ver.lines().next().unwrap_or("").trim(),
        "path": bin
    }))
}

pub fn list_models_api() -> Result<Value, String> {
    let key = api_key()?;
    let url = format!("{API_BASE}/models?key={}", urlencoding_lite(&key));
    let resp = agent().get(&url).call().map_err(map_err)?;
    let body: Value = resp.into_json().map_err(|e| e.to_string())?;
    let data: Vec<Value> = body
        .get("models")
        .and_then(|m| m.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|m| {
                    let name = m.get("name")?.as_str()?.trim_start_matches("models/");
                    Some(json!({"id": name, "name": name}))
                })
                .collect()
        })
        .unwrap_or_default();
    Ok(json!({ "data": data }))
}

fn map_err(e: ureq::Error) -> String {
    match e {
        ureq::Error::Status(code, resp) => {
            let body = credentials::redact(&resp.into_string().unwrap_or_default());
            match code {
                401 | 403 => format!("Gemini auth error ({code})."),
                429 => "Gemini quota/rate limit (429).".into(),
                _ => format!(
                    "Gemini HTTP {code}: {}",
                    body.chars().take(200).collect::<String>()
                ),
            }
        }
        other => credentials::redact(&other.to_string()),
    }
}

fn urlencoding_lite(s: &str) -> String {
    // Keys are URL-safe enough; still percent-encode reserved chars.
    let mut out = String::with_capacity(s.len());
    for b in s.bytes() {
        match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(b as char)
            }
            _ => out.push_str(&format!("%{b:02X}")),
        }
    }
    out
}

pub fn generate_api(
    model: &str,
    system: &str,
    user: &str,
    cancel: Arc<AtomicBool>,
    mut on_delta: impl FnMut(&str),
) -> Result<InferenceOutcome, String> {
    if cancel.load(Ordering::SeqCst) {
        return Err("cancelled".into());
    }
    let key = api_key()?;
    let url = format!(
        "{API_BASE}/models/{model}:generateContent?key={}",
        urlencoding_lite(&key)
    );
    let body = json!({
        "systemInstruction": { "parts": [{ "text": system }] },
        "contents": [{ "role": "user", "parts": [{ "text": user }] }],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.3
        }
    });
    let resp = agent()
        .post(&url)
        .set("Content-Type", "application/json")
        .send_json(&body)
        .map_err(map_err)?;
    let v: Value = resp.into_json().map_err(|e| e.to_string())?;
    let text = v
        .pointer("/candidates/0/content/parts/0/text")
        .and_then(|t| t.as_str())
        .unwrap_or("")
        .to_string();
    if !text.is_empty() {
        on_delta(&text);
    }
    let usage = v.get("usageMetadata").cloned();
    Ok(InferenceOutcome {
        text,
        usage,
        model: Some(model.to_string()),
    })
}

/// Gemini CLI headless: prompt via stdin/args, capture stdout. No auto-approve.
pub fn run_cli(
    system: &str,
    user: &str,
    model: Option<&str>,
    cancel: Arc<AtomicBool>,
    mut on_delta: impl FnMut(&str),
) -> Result<InferenceOutcome, String> {
    let bin = env::which("gemini").ok_or("Gemini CLI not found")?;
    let prompt = format!("{system}\n\n{user}");
    // Never pass --yolo / auto-approve flags — those bypass host-mediated approvals.
    let mut cmd = env::command(&bin, &env::home());
    cmd.arg("-p").arg(&prompt);
    if let Some(m) = model {
        if !m.is_empty() {
            cmd.arg("--model").arg(m);
        }
    }
    cmd.stdout(Stdio::piped()).stderr(Stdio::piped());

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("could not start gemini: {e}"))?;
    let stdout = child.stdout.take().ok_or("no stdout")?;
    let mut reader = BufReader::new(stdout);
    let mut assembled = String::new();
    let mut line = String::new();
    loop {
        if cancel.load(Ordering::SeqCst) {
            let _ = child.kill();
            return Err("cancelled".into());
        }
        line.clear();
        match reader.read_line(&mut line) {
            Ok(0) => break,
            Ok(_) => {
                assembled.push_str(&line);
                on_delta(&line);
            }
            Err(e) => return Err(e.to_string()),
        }
    }
    let status = child.wait().map_err(|e| e.to_string())?;
    if !status.success() && assembled.trim().is_empty() {
        return Err(format!("Gemini CLI exited with {status}"));
    }
    Ok(InferenceOutcome {
        text: assembled,
        usage: None,
        model: model.map(|s| s.to_string()),
    })
}

pub fn make_runner(prefer_cli: bool, model_override: Option<String>) -> StreamFn {
    Box::new(move |system, user, model, cancel, mut on_delta| {
        let m = model
            .or(model_override)
            .unwrap_or_else(|| DEFAULT_API_MODEL.to_string());
        if prefer_cli && env::which("gemini").is_some() {
            // CLI path: avoid --yolo; if CLI cannot do interactive approvals, treat as text assist.
            match run_cli(&system, &user, Some(&m), cancel.clone(), |d| on_delta(d)) {
                Ok(o) => Ok(o),
                Err(e) if credentials::has_secret(CredentialKind::GeminiApi) => {
                    // Fall back to API only when user has configured API key (explicit dual mode).
                    let _ = e;
                    generate_api(&m, &system, &user, cancel, move |d| on_delta(d))
                }
                Err(e) => Err(e),
            }
        } else {
            generate_api(&m, &system, &user, cancel, move |d| on_delta(d))
        }
    })
}

pub fn start(
    bridge: &InferenceBridge,
    app: AppHandle,
    db: Arc<Db>,
    workspace: std::path::PathBuf,
    workflow: String,
    prompt: String,
    model: Option<String>,
) -> Result<RunSummary, String> {
    let has_cli = env::which("gemini").is_some();
    let has_api = credentials::has_secret(CredentialKind::GeminiApi);
    if !has_cli && !has_api {
        return Err(
            "Gemini is not configured. Install the Gemini CLI or add a Developer API key in Settings."
                .into(),
        );
    }
    // Prefer API for structured JSON reliability; CLI when API absent.
    let prefer_cli = !has_api && has_cli;
    let model = model.filter(|s| !s.is_empty());
    bridge.start(
        app,
        db,
        InferenceRequest {
            provider: ProviderId::Gemini,
            workspace,
            workflow,
            prompt,
            model: model.clone(),
        },
        make_runner(prefer_cli, model),
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn urlencode_key_safe() {
        assert_eq!(urlencoding_lite("abc"), "abc");
        assert!(urlencoding_lite("a b").contains('%'));
    }

    #[test]
    fn parse_generate_path() {
        let v = json!({"candidates":[{"content":{"parts":[{"text":"{\"answer\":\"ok\"}"}]}}]});
        let t = v
            .pointer("/candidates/0/content/parts/0/text")
            .and_then(|x| x.as_str())
            .unwrap();
        assert!(t.contains("answer"));
    }
}
