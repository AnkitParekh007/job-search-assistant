//! OpenAI Responses API provider (BYOK).
//!
//! Docs: https://developers.openai.com/api/reference/responses/overview
//! Secrets live in the OS keychain — never SQLite. Codex ChatGPT auth is not reused.

use super::inference::{InferenceBridge, InferenceOutcome, InferenceRequest, StreamFn};
use super::types::{ProviderCapability, ProviderId, ProviderStatus};
use crate::db::{Db, RunSummary};
use crate::security::credentials::{self, CredentialKind};
use serde_json::{json, Value};
use std::io::{BufRead, BufReader};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tauri::AppHandle;

const DEFAULT_MODEL: &str = "gpt-4.1-mini";
const API_BASE: &str = "https://api.openai.com/v1";

fn caps() -> Vec<ProviderCapability> {
    [
        ("streaming", "Streaming responses", true),
        ("structured", "Structured JSON outputs", true),
        ("tools", "Host-orchestrated function calling", true),
        ("agentic", "Built-in agent environment", false),
        ("byok", "Bring-your-own Platform API key", true),
        ("local", "On-device inference", false),
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
    let has_key = credentials::has_secret(CredentialKind::OpenaiApi);
    ProviderStatus {
        id: ProviderId::OpenaiApi.as_str().into(),
        name: ProviderId::OpenaiApi.display_name().into(),
        available: true,
        authenticated: has_key,
        detail: if has_key {
            "API key stored in OS keychain · Responses API".into()
        } else {
            "Not configured — add an OpenAI Platform API key".into()
        },
        fix: "Create a key at https://platform.openai.com/api-keys and paste it in Settings. This is separate from a ChatGPT / Codex subscription.".into(),
        planned: false,
        capabilities: caps(),
        models: vec![
            "gpt-4.1".into(),
            "gpt-4.1-mini".into(),
            "gpt-4o".into(),
            "gpt-4o-mini".into(),
            "o4-mini".into(),
        ],
        default_model: Some(DEFAULT_MODEL.into()),
    }
}

pub fn agent() -> ureq::Agent {
    ureq::AgentBuilder::new()
        .timeout_connect(Duration::from_secs(15))
        .timeout_read(Duration::from_secs(180))
        .build()
}

fn auth_header() -> Result<String, String> {
    let key = credentials::load_secret(CredentialKind::OpenaiApi)?.ok_or_else(|| {
        "OpenAI API key not configured. Add it in Settings → AI Providers.".to_string()
    })?;
    Ok(format!("Bearer {key}"))
}

pub fn test_connection() -> Result<Value, String> {
    let auth = auth_header()?;
    let resp = agent()
        .get(&format!("{API_BASE}/models"))
        .set("Authorization", &auth)
        .call()
        .map_err(map_http_err)?;
    let status = resp.status();
    if status == 401 || status == 403 {
        return Err("OpenAI rejected the API key (401/403). Replace it in Settings.".into());
    }
    if status == 429 {
        return Err("OpenAI rate limit (429). Try again later.".into());
    }
    if !(200..300).contains(&status) {
        return Err(format!("OpenAI models probe failed with HTTP {status}"));
    }
    let body: Value = resp.into_json().map_err(|e| e.to_string())?;
    let count = body
        .get("data")
        .and_then(|d| d.as_array())
        .map(|a| a.len())
        .unwrap_or(0);
    Ok(json!({
        "ok": true,
        "models_visible": count,
        "message": "OpenAI Platform API key accepted"
    }))
}

pub fn list_models() -> Result<Value, String> {
    let auth = auth_header()?;
    let resp = agent()
        .get(&format!("{API_BASE}/models"))
        .set("Authorization", &auth)
        .call()
        .map_err(map_http_err)?;
    let body: Value = resp.into_json().map_err(|e| e.to_string())?;
    let mut ids: Vec<String> = body
        .get("data")
        .and_then(|d| d.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|m| m.get("id").and_then(|i| i.as_str()).map(|s| s.to_string()))
                .filter(|id| {
                    id.starts_with("gpt-")
                        || id.starts_with("o1")
                        || id.starts_with("o3")
                        || id.starts_with("o4")
                })
                .collect()
        })
        .unwrap_or_default();
    ids.sort();
    ids.dedup();
    Ok(
        json!({ "data": ids.into_iter().map(|id| json!({"id": id, "name": id})).collect::<Vec<_>>() }),
    )
}

pub fn map_http_err(e: ureq::Error) -> String {
    match e {
        ureq::Error::Status(code, resp) => {
            let body = resp.into_string().unwrap_or_default();
            let safe = credentials::redact(&body);
            match code {
                401 | 403 => format!("OpenAI auth error ({code}). Check or replace your API key."),
                429 => "OpenAI rate limit (429). Back off and retry.".into(),
                _ => format!("OpenAI HTTP {code}: {}", truncate(&safe, 240)),
            }
        }
        other => credentials::redact(&other.to_string()),
    }
}

fn truncate(s: &str, n: usize) -> String {
    if s.len() <= n {
        s.to_string()
    } else {
        format!("{}…", &s[..n])
    }
}

/// Non-streaming Responses API call used by unit-style probes and as SSE fallback.
pub fn create_response(model: &str, system: &str, user: &str) -> Result<InferenceOutcome, String> {
    let auth = auth_header()?;
    let body = json!({
        "model": model,
        "instructions": system,
        "input": user,
        "text": { "format": { "type": "json_object" } },
        "store": false
    });
    let resp = agent()
        .post(&format!("{API_BASE}/responses"))
        .set("Authorization", &auth)
        .set("Content-Type", "application/json")
        .send_json(&body)
        .map_err(map_http_err)?;
    let v: Value = resp.into_json().map_err(|e| e.to_string())?;
    let text = extract_output_text(&v).unwrap_or_default();
    let usage = v.get("usage").cloned();
    let model_out = v
        .get("model")
        .and_then(|m| m.as_str())
        .map(|s| s.to_string());
    Ok(InferenceOutcome {
        text,
        usage,
        model: model_out,
    })
}

pub fn extract_output_text(v: &Value) -> Option<String> {
    if let Some(s) = v.get("output_text").and_then(|x| x.as_str()) {
        return Some(s.to_string());
    }
    let output = v.get("output")?.as_array()?;
    let mut parts = Vec::new();
    for item in output {
        if item.get("type").and_then(|t| t.as_str()) != Some("message") {
            continue;
        }
        if let Some(content) = item.get("content").and_then(|c| c.as_array()) {
            for c in content {
                if let Some(t) = c.get("text").and_then(|t| t.as_str()) {
                    parts.push(t.to_string());
                } else if let Some(t) = c.get("output_text").and_then(|t| t.as_str()) {
                    parts.push(t.to_string());
                }
            }
        }
    }
    if parts.is_empty() {
        None
    } else {
        Some(parts.join(""))
    }
}

/// Streaming Responses API (SSE). Falls back to non-streaming on parse issues.
pub fn stream_response(
    model: &str,
    system: &str,
    user: &str,
    cancel: Arc<AtomicBool>,
    mut on_delta: impl FnMut(&str),
) -> Result<InferenceOutcome, String> {
    let auth = auth_header()?;
    let body = json!({
        "model": model,
        "instructions": system,
        "input": user,
        "stream": true,
        "text": { "format": { "type": "json_object" } },
        "store": false
    });
    let resp = match agent()
        .post(&format!("{API_BASE}/responses"))
        .set("Authorization", &auth)
        .set("Content-Type", "application/json")
        .set("Accept", "text/event-stream")
        .send_json(&body)
    {
        Ok(r) => r,
        Err(e) => {
            // Some accounts/models may reject stream+json_object; fall back.
            let _ = e;
            return create_response(model, system, user);
        }
    };

    let mut reader = BufReader::new(resp.into_reader());
    let mut assembled = String::new();
    let mut usage = None;
    let mut model_out = Some(model.to_string());
    let mut line = String::new();

    loop {
        if cancel.load(Ordering::SeqCst) {
            return Err("cancelled".into());
        }
        line.clear();
        let n = reader.read_line(&mut line).map_err(|e| e.to_string())?;
        if n == 0 {
            break;
        }
        let trimmed = line.trim_end();
        if trimmed.is_empty() || trimmed.starts_with(':') {
            continue;
        }
        let data = if let Some(rest) = trimmed.strip_prefix("data:") {
            rest.trim()
        } else {
            continue;
        };
        if data == "[DONE]" {
            break;
        }
        let Ok(ev) = serde_json::from_str::<Value>(data) else {
            continue;
        };
        let et = ev.get("type").and_then(|t| t.as_str()).unwrap_or("");
        if et.contains("response.output_text.delta") || et == "response.output_text.delta" {
            if let Some(d) = ev.get("delta").and_then(|d| d.as_str()) {
                assembled.push_str(d);
                on_delta(d);
            }
        } else if et == "response.completed" {
            if let Some(u) = ev.pointer("/response/usage").cloned() {
                usage = Some(u);
            }
            if let Some(m) = ev
                .pointer("/response/model")
                .and_then(|m| m.as_str())
                .map(|s| s.to_string())
            {
                model_out = Some(m);
            }
            if assembled.is_empty() {
                if let Some(t) = ev.get("response").and_then(extract_output_text) {
                    assembled = t;
                }
            }
        } else if et == "error" || et == "response.failed" {
            let msg = ev
                .pointer("/error/message")
                .or_else(|| ev.get("message"))
                .and_then(|m| m.as_str())
                .unwrap_or("Responses API error");
            return Err(credentials::redact(msg));
        }
    }

    if assembled.is_empty() {
        // Empty stream — try non-stream once (no double-charge risk beyond one fallback).
        return create_response(model, system, user);
    }

    Ok(InferenceOutcome {
        text: assembled,
        usage,
        model: model_out,
    })
}

pub fn make_runner(model_override: Option<String>) -> StreamFn {
    Box::new(move |system, user, model, cancel, mut on_delta| {
        let m = model
            .or(model_override)
            .unwrap_or_else(|| DEFAULT_MODEL.to_string());
        stream_response(&m, &system, &user, cancel, move |d| on_delta(d))
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
    if !credentials::has_secret(CredentialKind::OpenaiApi) {
        return Err(
            "OpenAI API key not configured. Add a Platform API key in Settings → AI Providers."
                .into(),
        );
    }
    let model = model.filter(|s| !s.is_empty());
    bridge.start(
        app,
        db,
        InferenceRequest {
            provider: ProviderId::OpenaiApi,
            workspace,
            workflow,
            prompt,
            model: model.clone(),
        },
        make_runner(model),
    )
}

/// Parse helpers for mock tests.
#[cfg_attr(not(test), allow(dead_code))]
pub fn parse_sse_delta_line(line: &str) -> Option<String> {
    let data = line.strip_prefix("data:")?.trim();
    if data == "[DONE]" {
        return None;
    }
    let ev: Value = serde_json::from_str(data).ok()?;
    if ev.get("type").and_then(|t| t.as_str())? == "response.output_text.delta" {
        ev.get("delta")?.as_str().map(|s| s.to_string())
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_sse_delta() {
        let line = r#"data: {"type":"response.output_text.delta","delta":"{\"a\":"}"#;
        assert_eq!(parse_sse_delta_line(line).as_deref(), Some("{\"a\":"));
    }

    #[test]
    fn extract_output_from_message() {
        let v = json!({
            "output": [{
                "type": "message",
                "content": [{"type": "output_text", "text": "{\"answer\":\"ok\"}"}]
            }]
        });
        assert_eq!(extract_output_text(&v).unwrap(), "{\"answer\":\"ok\"}");
    }
}
