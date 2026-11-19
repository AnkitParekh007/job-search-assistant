//! Local-first Ollama provider.
//!
//! Default endpoint: http://127.0.0.1:11434
//! Remote URLs require explicit settings and SSRF checks. No cloud fallback.

use super::inference::{InferenceBridge, InferenceOutcome, InferenceRequest, StreamFn};
use super::types::{ProviderCapability, ProviderId, ProviderStatus};
use crate::db::{Db, RunSummary};
use crate::env;
use serde_json::{json, Value};
use std::io::{BufRead, BufReader};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tauri::AppHandle;

const DEFAULT_ENDPOINT: &str = "http://127.0.0.1:11434";

fn caps(running: bool, models: usize) -> Vec<ProviderCapability> {
    let mut v: Vec<ProviderCapability> = [
        ("local", "On-device inference", true),
        ("streaming", "Streaming chat", running),
        ("structured", "JSON mode (model-dependent)", running),
        ("tools", "Tool calling (model-dependent)", false),
        ("agentic", "Full agent parity", false),
        ("privacy", "No third-party cloud by default", true),
    ]
    .iter()
    .map(|(id, label, supported)| ProviderCapability {
        id: (*id).into(),
        label: (*label).into(),
        supported: *supported,
    })
    .collect();
    v.push(ProviderCapability {
        id: "models".into(),
        label: format!("{models} local model(s)"),
        supported: models > 0,
    });
    v
}

pub fn configured_endpoint(setting: Option<&str>) -> Result<String, String> {
    let raw = setting.unwrap_or(DEFAULT_ENDPOINT).trim();
    validate_endpoint(raw)
}

/// SSRF / safety: allow loopback by default; remote only if explicitly http(s) with host.
pub fn validate_endpoint(raw: &str) -> Result<String, String> {
    let u = url::Url::parse(raw).map_err(|_| "Ollama endpoint must be a valid URL".to_string())?;
    if u.scheme() != "http" && u.scheme() != "https" {
        return Err("Ollama endpoint must be http or https".into());
    }
    let host = u.host_str().ok_or("Ollama endpoint missing host")?;
    let local = matches!(host, "127.0.0.1" | "localhost" | "::1" | "[::1]");
    if !local {
        // Block link-local / metadata-ish hosts.
        if host.starts_with("169.254.") || host == "metadata.google.internal" {
            return Err("Refusing this Ollama host (SSRF protection)".into());
        }
        if u.port_or_known_default() == Some(0) {
            return Err("Invalid Ollama port".into());
        }
    }
    // Normalize without trailing slash.
    let mut s = u.as_str().trim_end_matches('/').to_string();
    if s.ends_with('/') {
        s.pop();
    }
    Ok(s)
}

pub fn is_remote(endpoint: &str) -> bool {
    !endpoint.contains("127.0.0.1") && !endpoint.contains("localhost") && !endpoint.contains("::1")
}

fn agent() -> ureq::Agent {
    ureq::AgentBuilder::new()
        .timeout_connect(Duration::from_secs(3))
        .timeout_read(Duration::from_secs(300))
        .build()
}

pub fn probe(endpoint: &str) -> Result<(bool, Vec<ModelInfo>), String> {
    let ep = validate_endpoint(endpoint)?;
    let resp = agent()
        .get(&format!("{ep}/api/tags"))
        .call()
        .map_err(|e| format!("Ollama not reachable at {ep}: {e}"))?;
    let body: Value = resp.into_json().map_err(|e| e.to_string())?;
    let models = parse_tags(&body);
    Ok((true, models))
}

#[derive(Debug, Clone)]
pub struct ModelInfo {
    pub name: String,
    pub size: Option<u64>,
    #[allow(dead_code)]
    pub digest: Option<String>,
}

pub fn parse_tags(body: &Value) -> Vec<ModelInfo> {
    body.get("models")
        .and_then(|m| m.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|m| {
                    Some(ModelInfo {
                        name: m.get("name")?.as_str()?.to_string(),
                        size: m.get("size").and_then(|s| s.as_u64()),
                        digest: m
                            .get("digest")
                            .and_then(|d| d.as_str())
                            .map(|s| s.to_string()),
                    })
                })
                .collect()
        })
        .unwrap_or_default()
}

pub fn status(endpoint_setting: Option<&str>) -> ProviderStatus {
    let installed = env::which("ollama").is_some();
    let endpoint =
        configured_endpoint(endpoint_setting).unwrap_or_else(|_| DEFAULT_ENDPOINT.into());
    let remote = is_remote(&endpoint);
    let (running, models) = match probe(&endpoint) {
        Ok((true, m)) => (true, m),
        _ => (false, vec![]),
    };
    let names: Vec<String> = models.iter().map(|m| m.name.clone()).collect();
    let detail = if running {
        let remote_note = if remote {
            " · REMOTE endpoint (not local-only)"
        } else {
            " · local"
        };
        format!(
            "Service online at {endpoint}{remote_note} · {} model(s)",
            names.len()
        )
    } else if installed {
        format!("Ollama installed but service not reachable at {endpoint}. Run `ollama serve`.")
    } else {
        "Ollama not installed".into()
    };
    ProviderStatus {
        id: ProviderId::Ollama.as_str().into(),
        name: ProviderId::Ollama.display_name().into(),
        available: installed || running,
        authenticated: running, // "connected" for local service
        detail,
        fix: "Install from https://ollama.com, run `ollama serve`, then `ollama pull <model>` (user-initiated; the app never auto-downloads).".into(),
        planned: false,
        capabilities: caps(running, names.len()),
        models: names,
        default_model: models.first().map(|m| m.name.clone()),
    }
}

pub fn test_connection(endpoint_setting: Option<&str>) -> Result<Value, String> {
    let ep = configured_endpoint(endpoint_setting)?;
    let (ok, models) = probe(&ep)?;
    Ok(json!({
        "ok": ok,
        "endpoint": ep,
        "remote": is_remote(&ep),
        "models": models.iter().map(|m| json!({
            "name": m.name,
            "size": m.size,
        })).collect::<Vec<_>>(),
        "memory_warning": memory_warning(&models),
    }))
}

pub fn list_models(endpoint_setting: Option<&str>) -> Result<Value, String> {
    let ep = configured_endpoint(endpoint_setting)?;
    let (_, models) = probe(&ep)?;
    Ok(json!({
        "data": models.iter().map(|m| json!({
            "id": m.name,
            "name": m.name,
            "size": m.size,
        })).collect::<Vec<_>>(),
        "memory_warning": memory_warning(&models),
    }))
}

pub fn memory_warning(models: &[ModelInfo]) -> Option<String> {
    let total_ram = available_ram_bytes();
    let large: Vec<_> = models
        .iter()
        .filter(|m| m.size.unwrap_or(0) > 4_000_000_000)
        .map(|m| m.name.as_str())
        .collect();
    if large.is_empty() {
        return None;
    }
    Some(match total_ram {
        Some(ram) if ram < 10_000_000_000 => {
            format!(
                "This machine reports ~{} GB RAM. Large models ({}) may not fit comfortably. Prefer smaller models for lightweight tasks.",
                ram / 1_000_000_000,
                large.join(", ")
            )
        }
        _ => format!(
            "Large models installed ({}). Avoid loading several at once on constrained laptops.",
            large.join(", ")
        ),
    })
}

#[cfg(target_os = "macos")]
fn available_ram_bytes() -> Option<u64> {
    let out = std::process::Command::new("sysctl")
        .args(["-n", "hw.memsize"])
        .output()
        .ok()?;
    let s = String::from_utf8_lossy(&out.stdout);
    s.trim().parse().ok()
}

#[cfg(not(target_os = "macos"))]
fn available_ram_bytes() -> Option<u64> {
    None
}

pub fn chat_stream(
    endpoint: &str,
    model: &str,
    system: &str,
    user: &str,
    cancel: Arc<AtomicBool>,
    mut on_delta: impl FnMut(&str),
) -> Result<InferenceOutcome, String> {
    let ep = validate_endpoint(endpoint)?;
    let body = json!({
        "model": model,
        "stream": true,
        "format": "json",
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user}
        ]
    });
    let resp = agent()
        .post(&format!("{ep}/api/chat"))
        .set("Content-Type", "application/json")
        .send_json(&body)
        .map_err(|e| format!("Ollama chat failed: {e}"))?;

    let mut reader = BufReader::new(resp.into_reader());
    let mut assembled = String::new();
    let mut line = String::new();
    let mut model_out = Some(model.to_string());

    loop {
        if cancel.load(Ordering::SeqCst) {
            return Err("cancelled".into());
        }
        line.clear();
        let n = reader.read_line(&mut line).map_err(|e| e.to_string())?;
        if n == 0 {
            break;
        }
        let Ok(ev) = serde_json::from_str::<Value>(line.trim()) else {
            continue;
        };
        if let Some(m) = ev.get("model").and_then(|m| m.as_str()) {
            model_out = Some(m.to_string());
        }
        if let Some(content) = ev.pointer("/message/content").and_then(|c| c.as_str()) {
            if !content.is_empty() {
                assembled.push_str(content);
                on_delta(content);
            }
        }
        if ev.get("done").and_then(|d| d.as_bool()) == Some(true) {
            break;
        }
    }

    if assembled.is_empty() {
        return Err(
            "Ollama returned empty output. Is the model pulled? Try `ollama pull <model>`.".into(),
        );
    }

    Ok(InferenceOutcome {
        text: assembled,
        usage: None,
        model: model_out,
    })
}

#[cfg_attr(not(test), allow(dead_code))]
pub fn parse_ndjson_chunk(line: &str) -> Option<String> {
    let ev: Value = serde_json::from_str(line.trim()).ok()?;
    ev.pointer("/message/content")?
        .as_str()
        .map(|s| s.to_string())
}

pub fn make_runner(endpoint: String, model_override: Option<String>) -> StreamFn {
    Box::new(move |system, user, model, cancel, mut on_delta| {
        let m = model.or(model_override).ok_or_else(|| {
            "No Ollama model selected. Pull a model (`ollama pull llama3.2`) and choose it in Settings."
                .to_string()
        })?;
        chat_stream(&endpoint, &m, &system, &user, cancel, move |d| on_delta(d))
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
    endpoint_setting: Option<String>,
) -> Result<RunSummary, String> {
    let endpoint = configured_endpoint(endpoint_setting.as_deref())?;
    let (running, models) = probe(&endpoint)?;
    if !running {
        return Err(format!(
            "Ollama is not reachable at {endpoint}. Start it with `ollama serve`."
        ));
    }
    let model = model
        .filter(|s| !s.is_empty())
        .or_else(|| models.first().map(|m| m.name.clone()));
    if model.is_none() {
        return Err(
            "No local Ollama models found. Pull one yourself (e.g. `ollama pull llama3.2`); the app never auto-downloads."
                .into(),
        );
    }
    bridge.start(
        app,
        db,
        InferenceRequest {
            provider: ProviderId::Ollama,
            workspace,
            workflow,
            prompt,
            model: model.clone(),
        },
        make_runner(endpoint, model),
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_loopback() {
        assert!(validate_endpoint("http://127.0.0.1:11434").is_ok());
        assert!(validate_endpoint("http://localhost:11434").is_ok());
    }

    #[test]
    fn rejects_metadata() {
        assert!(validate_endpoint("http://169.254.169.254/").is_err());
    }

    #[test]
    fn parses_stream_chunk() {
        let line = r#"{"model":"llama3.2","message":{"role":"assistant","content":"{\"a\":"},"done":false}"#;
        assert_eq!(parse_ndjson_chunk(line).as_deref(), Some("{\"a\":"));
    }

    #[test]
    fn parse_tags_list() {
        let body = json!({"models":[{"name":"llama3.2:latest","size":2_000_000_000u64}]});
        let m = parse_tags(&body);
        assert_eq!(m[0].name, "llama3.2:latest");
    }
}
