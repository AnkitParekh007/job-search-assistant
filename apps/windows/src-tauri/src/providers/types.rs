//! Shared provider identity, capabilities, and start options.

use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "snake_case")]
pub enum ProviderId {
    #[default]
    Claude,
    Codex,
    OpenaiApi,
    Gemini,
    Ollama,
}

impl ProviderId {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Claude => "claude",
            Self::Codex => "codex",
            Self::OpenaiApi => "openai_api",
            Self::Gemini => "gemini",
            Self::Ollama => "ollama",
        }
    }

    pub fn parse(s: &str) -> Option<Self> {
        match s.trim().to_ascii_lowercase().as_str() {
            "claude" | "claude_code" => Some(Self::Claude),
            "codex" | "openai_codex" => Some(Self::Codex),
            "openai_api" | "openai" | "responses" => Some(Self::OpenaiApi),
            "gemini" | "google_gemini" => Some(Self::Gemini),
            "ollama" => Some(Self::Ollama),
            _ => None,
        }
    }

    pub fn display_name(self) -> &'static str {
        match self {
            Self::Claude => "Claude Code",
            Self::Codex => "OpenAI Codex",
            Self::OpenaiApi => "OpenAI API",
            Self::Gemini => "Google Gemini",
            Self::Ollama => "Ollama",
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct ProviderCapability {
    pub id: String,
    pub label: String,
    pub supported: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct ProviderStatus {
    pub id: String,
    pub name: String,
    pub available: bool,
    pub authenticated: bool,
    pub detail: String,
    pub fix: String,
    pub planned: bool,
    pub capabilities: Vec<ProviderCapability>,
    pub models: Vec<String>,
    pub default_model: Option<String>,
}

#[derive(Debug, Clone)]
pub struct StartOpts {
    pub workspace: std::path::PathBuf,
    pub workflow: String,
    pub prompt: String,
    pub model: Option<String>,
    pub resume: Option<String>,
    pub provider: ProviderId,
}

/// Coarse normalized event kinds shared across providers.
pub mod kind {
    pub const STARTED: &str = "execution.started";
    pub const STREAMING: &str = "execution.streaming";
    pub const AGENT_MESSAGE: &str = "agent.message";
    pub const TOOL_STARTED: &str = "tool.started";
    pub const TOOL_OUTPUT: &str = "tool.output";
    pub const TOOL_COMPLETED: &str = "tool.completed";
    pub const APPROVAL_REQUIRED: &str = "user.approval_required";
    #[allow(dead_code)]
    pub const INPUT_REQUIRED: &str = "user.input_required";
    #[allow(dead_code)]
    pub const PAUSED: &str = "execution.paused";
    pub const COMPLETED: &str = "execution.completed";
    pub const FAILED: &str = "execution.failed";
    pub const CANCELLED: &str = "execution.cancelled";
    pub const USAGE: &str = "usage.info";
}

#[allow(dead_code)]
pub fn wrap_norm(kind: &str, data: Value) -> (String, Value) {
    (kind.to_string(), data)
}
