//! OpenAI Responses API provider — extension point only (not production-ready).

use super::types::{ProviderId, ProviderStatus};

#[allow(dead_code)]
pub fn status() -> ProviderStatus {
    ProviderStatus {
        id: ProviderId::OpenaiApi.as_str().into(),
        name: ProviderId::OpenaiApi.display_name().into(),
        available: false,
        authenticated: false,
        detail: "Stub — Responses API adapter not wired yet.".into(),
        fix: "Use Claude Code or OpenAI Codex for workflows today.".into(),
        planned: true,
        capabilities: vec![],
        models: vec![],
        default_model: None,
    }
}
