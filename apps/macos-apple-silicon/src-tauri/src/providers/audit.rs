//! Allowlisted diagnostic evidence; never persist provider response bodies or identities.
use super::types::{ProviderId, ProviderStatus};
use serde_json::{json, Value};

pub fn snapshot(id: ProviderId, status: &ProviderStatus, model: Option<&str>, resume: bool) -> Value {
    let auth = match id {
        ProviderId::Claude if status.authenticated => "reported_signed_in",
        ProviderId::Claude => "not_signed_in_or_probe_failed",
        ProviderId::Codex if status.authenticated => "configuration_hint_only",
        ProviderId::Codex => "not_configured",
        ProviderId::OpenaiApi if status.authenticated => "key_present_unverified",
        ProviderId::Gemini if status.authenticated => "configured_unverified",
        ProviderId::Ollama if status.authenticated => "service_reachable",
        _ => "not_configured_or_unreachable",
    };
    let model = model.filter(|m| !m.trim().is_empty());
    let model_state = match (id, model) {
        (ProviderId::Ollama, Some(m)) if status.models.iter().any(|x| x == m) => "listed",
        (ProviderId::Ollama, Some(_)) => "not_listed",
        (ProviderId::Ollama, None) if status.models.is_empty() => "no_models",
        (ProviderId::Ollama, None) => "default_available",
        (_, Some(_)) => "explicit_unverified",
        (_, None) => "default_unverified",
    };
    json!({
        "schema_version": 1, "provider": id.as_str(), "available": status.available,
        "account_state": auth, "model_state": model_state, "resume_requested": resume,
        "quota_state": "unknown", "billing_state": "unknown",
        "execution_mode": if matches!(id, ProviderId::Claude | ProviderId::Codex) {
            "agentic_host_approvals"
        } else { "structured_inference" },
        "evidence_type": "preflight_observation"
    })
}

// Only classify known transport/auth signals. Unknown is not an application defect.
pub fn classify(error: &str) -> &'static str {
    let e = error.to_ascii_lowercase();
    if e.contains("auth error (401") || e.contains("auth error (403") || e.contains("rejected the api key") {
        "authentication_or_permission"
    } else if e.contains("rate limit (429)") || e.contains("quota/rate limit (429)") || e.contains("quota exceeded (429)") {
        "quota_or_rate_limit"
    } else if e.contains("not reachable") || e.contains("connection refused") || e.contains("timed out") {
        "connectivity_or_timeout"
    } else {
        "unknown"
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn snapshot_excludes_raw_provider_fields() {
        let status = ProviderStatus {
            id: "codex".into(), name: "private-name".into(), available: true,
            authenticated: true, detail: "secret-token".into(), fix: "private-path".into(),
            planned: false, capabilities: vec![], models: vec!["private-model".into()],
            default_model: None,
        };
        let v = snapshot(ProviderId::Codex, &status, Some("secret-model"), true);
        assert_eq!(v["account_state"], "configuration_hint_only");
        assert_eq!(v["quota_state"], "unknown");
        assert!(!v.to_string().contains("secret"));
        assert!(!v.to_string().contains("private"));
    }
    #[test]
    fn classifies_known_failures_without_copying_error() {
        assert_eq!(classify("OpenAI auth error (401)."), "authentication_or_permission");
        assert_eq!(classify("Gemini quota/rate limit (429)."), "quota_or_rate_limit");
        assert_eq!(classify("connection refused"), "connectivity_or_timeout");
        assert_eq!(classify("unexpected output"), "unknown");
    }
}
