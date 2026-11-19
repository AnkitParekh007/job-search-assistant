//! Provider discovery and status probes (no secrets returned).

use super::types::{ProviderCapability, ProviderId, ProviderStatus};
use crate::env;
use serde_json::Value;

fn caps(items: &[(&str, &str, bool)]) -> Vec<ProviderCapability> {
    items
        .iter()
        .map(|(id, label, supported)| ProviderCapability {
            id: (*id).into(),
            label: (*label).into(),
            supported: *supported,
        })
        .collect()
}

fn claude_status() -> ProviderStatus {
    let bin = env::which("claude");
    let available = bin.is_some();
    let auth = bin.as_ref().and_then(|p| {
        std::process::Command::new(p)
            .args(["auth", "status"])
            .env("PATH", env::child_path())
            .output()
            .ok()
            .and_then(|o| serde_json::from_slice::<Value>(&o.stdout).ok())
    });
    let logged = auth
        .as_ref()
        .and_then(|a| a.get("loggedIn"))
        .and_then(|b| b.as_bool())
        .unwrap_or(false);
    let detail = if let Some(p) = &bin {
        let ver = std::process::Command::new(p)
            .arg("--version")
            .env("PATH", env::child_path())
            .output()
            .ok()
            .map(|o| {
                let s = format!(
                    "{}{}",
                    String::from_utf8_lossy(&o.stdout),
                    String::from_utf8_lossy(&o.stderr)
                );
                s.lines().next().unwrap_or("").trim().to_string()
            })
            .unwrap_or_default();
        format!(
            "{} · {} via {}",
            if ver.is_empty() { "installed" } else { &ver },
            if logged { "signed in" } else { "signed out" },
            auth.as_ref()
                .and_then(|a| a.get("authMethod"))
                .and_then(|s| s.as_str())
                .unwrap_or("?")
        )
    } else {
        "Claude Code CLI not found".into()
    };
    ProviderStatus {
        id: ProviderId::Claude.as_str().into(),
        name: ProviderId::Claude.display_name().into(),
        available,
        authenticated: logged,
        detail,
        fix: "Install Claude Code (brew install --cask claude-code) and run `claude` once to sign in.".into(),
        planned: false,
        capabilities: caps(&[
            ("agentic", "Agentic workflows with tools", true),
            ("approvals", "Host permission approvals", true),
            ("sessions", "Resume sessions", true),
            ("streaming", "Streamed events", true),
            ("slash_commands", "Upstream slash commands", true),
        ]),
        models: vec!["opus".into(), "sonnet".into(), "haiku".into()],
        default_model: None,
    }
}

fn codex_status() -> ProviderStatus {
    let bin = env::which("codex");
    let available = bin.is_some();
    let detail = if let Some(p) = &bin {
        let ver = std::process::Command::new(p)
            .arg("--version")
            .env("PATH", env::child_path())
            .output()
            .ok()
            .map(|o| {
                let s = format!(
                    "{}{}",
                    String::from_utf8_lossy(&o.stdout),
                    String::from_utf8_lossy(&o.stderr)
                );
                s.lines().next().unwrap_or("").trim().to_string()
            })
            .unwrap_or_else(|| p.display().to_string());
        // Auth is verified when the app-server is started (account/read). Presence of
        // ~/.codex is a soft hint only — never read token files into the UI.
        let auth_hint = env::home().join(".codex").is_dir();
        format!(
            "{} · {}",
            if ver.is_empty() {
                p.display().to_string()
            } else {
                ver
            },
            if auth_hint {
                "Codex config present (sign-in checked when connecting)"
            } else {
                "not signed in yet — use Connect in Settings"
            }
        )
    } else {
        "Codex CLI not found".into()
    };
    let soft_auth = available && env::home().join(".codex").is_dir();
    ProviderStatus {
        id: ProviderId::Codex.as_str().into(),
        name: ProviderId::Codex.display_name().into(),
        available,
        authenticated: soft_auth,
        detail,
        fix: "Install the Codex CLI (`npm i -g @openai/codex` or see https://learn.chatgpt.com/docs/codex), then sign in with ChatGPT from Settings.".into(),
        planned: false,
        capabilities: caps(&[
            ("agentic", "Agentic execution via app-server", true),
            ("approvals", "Command and file-change approvals", true),
            ("sessions", "Thread resume", true),
            ("streaming", "Streamed agent events", true),
            ("slash_commands", "Upstream Claude slash commands", false),
            ("chatgpt_login", "ChatGPT sign-in", true),
        ]),
        models: vec![],
        default_model: None,
    }
}

fn planned(
    id: ProviderId,
    detail: &str,
    fix: &str,
    cap_notes: &[(&str, &str, bool)],
) -> ProviderStatus {
    ProviderStatus {
        id: id.as_str().into(),
        name: id.display_name().into(),
        available: false,
        authenticated: false,
        detail: detail.into(),
        fix: fix.into(),
        planned: true,
        capabilities: caps(cap_notes),
        models: vec![],
        default_model: None,
    }
}

pub fn list_providers() -> Vec<ProviderStatus> {
    vec![
        claude_status(),
        codex_status(),
        planned(
            ProviderId::OpenaiApi,
            "Planned — Responses API for direct model workflows (ranking summaries, drafting assists).",
            "Not implemented yet. Use Claude Code or Codex for agentic runs.",
            &[
                ("streaming", "Streaming", true),
                ("structured", "Structured outputs", true),
                ("tools", "Tool calling (app-orchestrated)", true),
                ("agentic", "Built-in agent environment", false),
            ],
        ),
        planned(
            ProviderId::Gemini,
            "Future — Google Gemini provider adapter.",
            "Not implemented yet.",
            &[
                ("streaming", "Streaming", true),
                ("structured", "Structured generation", true),
            ],
        ),
        planned(
            ProviderId::Ollama,
            "Future — local on-device inference for lightweight tasks.",
            "Not implemented yet. Quality and performance depend on the local model.",
            &[
                ("local", "On-device inference", true),
                ("agentic", "Full agent parity", false),
            ],
        ),
    ]
}

pub fn resolve_default(setting: Option<&str>) -> ProviderId {
    setting
        .and_then(ProviderId::parse)
        .unwrap_or(ProviderId::Claude)
}
