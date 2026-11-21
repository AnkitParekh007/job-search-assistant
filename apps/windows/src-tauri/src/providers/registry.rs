//! Provider discovery and status probes (no secrets returned).

use super::types::{ProviderCapability, ProviderId, ProviderStatus};
use crate::env;
use crate::security::credentials::{self, CredentialKind};
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
        // Soft hint only — never treat ~/.codex alone as authenticated Ready.
        let auth_hint = env::home().join(".codex").is_dir();
        format!(
            "{} · {}",
            if ver.is_empty() {
                p.display().to_string()
            } else {
                ver
            },
            if auth_hint {
                "config present — verify with Status / Connect (not assumed Ready)"
            } else {
                "not signed in yet — use Connect in Settings"
            }
        )
    } else {
        "Codex CLI not found".into()
    };
    // Soft auth hint for UI chips only; Ready requires account/read via Status.
    let soft_auth = available && env::home().join(".codex").is_dir();
    ProviderStatus {
        id: ProviderId::Codex.as_str().into(),
        name: ProviderId::Codex.display_name().into(),
        available,
        authenticated: soft_auth,
        detail,
        fix: "Install the Codex CLI (`npm i -g @openai/codex`), then sign in with ChatGPT from Settings.".into(),
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

pub fn list_providers(ollama_endpoint: Option<&str>) -> Vec<ProviderStatus> {
    let _ = credentials::has_secret(CredentialKind::OpenaiApi); // touch keyring path early
    vec![
        claude_status(),
        codex_status(),
        super::openai_api::status(),
        super::gemini::status(),
        super::ollama::status(ollama_endpoint),
    ]
}

pub fn resolve_default(setting: Option<&str>) -> ProviderId {
    setting
        .and_then(ProviderId::parse)
        .unwrap_or(ProviderId::Claude)
}

/// Fail closed: the exact selected provider must be ready before any AI run starts.
pub fn ensure_ready(id: ProviderId, ollama_endpoint: Option<&str>) -> Result<(), String> {
    let status = match id {
        ProviderId::Claude => claude_status(),
        ProviderId::Codex => codex_status(),
        ProviderId::OpenaiApi => super::openai_api::status(),
        ProviderId::Gemini => super::gemini::status(),
        ProviderId::Ollama => super::ollama::status(ollama_endpoint),
    };
    let ready = match id {
        ProviderId::Claude | ProviderId::Codex => status.available && status.authenticated,
        ProviderId::OpenaiApi | ProviderId::Gemini | ProviderId::Ollama => status.authenticated,
    };
    if ready {
        Ok(())
    } else {
        Err(format!(
            "{} is not ready ({}). {}",
            status.name, status.detail, status.fix
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ensure_ready_rejects_unconfigured_openai() {
        let err = ensure_ready(ProviderId::OpenaiApi, None).unwrap_err();
        assert!(
            err.contains("OpenAI") || err.contains("not ready") || err.contains("Not configured"),
            "{err}"
        );
    }
}
