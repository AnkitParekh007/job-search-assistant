//! Platform keychain / credential manager wrappers.
//!
//! Keys are never logged. Account names are stable provider ids only.

use keyring::Entry;

const SERVICE: &str = "dev.local.aijobsearch.providers";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CredentialKind {
    OpenaiApi,
    GeminiApi,
}

impl CredentialKind {
    pub fn as_account(self) -> &'static str {
        match self {
            Self::OpenaiApi => "openai_api_key",
            Self::GeminiApi => "gemini_api_key",
        }
    }

    pub fn parse(s: &str) -> Option<Self> {
        match s.trim().to_ascii_lowercase().as_str() {
            "openai_api" | "openai" | "openai_api_key" => Some(Self::OpenaiApi),
            "gemini" | "gemini_api" | "gemini_api_key" => Some(Self::GeminiApi),
            _ => None,
        }
    }
}

fn entry(kind: CredentialKind) -> Result<Entry, String> {
    Entry::new(SERVICE, kind.as_account()).map_err(|e| format!("secure storage unavailable: {e}"))
}

pub fn store_secret(kind: CredentialKind, secret: &str) -> Result<(), String> {
    let trimmed = secret.trim();
    if trimmed.is_empty() {
        return Err("API key is empty".into());
    }
    if trimmed.len() > 8_192 {
        return Err("API key is too long".into());
    }
    // Reject obvious non-key payloads (newlines / control chars).
    if trimmed.chars().any(|c| c.is_control()) {
        return Err("API key contains invalid characters".into());
    }
    entry(kind)?
        .set_password(trimmed)
        .map_err(|e| format!("could not store credential: {e}"))
}

pub fn load_secret(kind: CredentialKind) -> Result<Option<String>, String> {
    match entry(kind)?.get_password() {
        Ok(s) if !s.is_empty() => Ok(Some(s)),
        Ok(_) => Ok(None),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(format!("could not read credential: {e}")),
    }
}

pub fn clear_secret(kind: CredentialKind) -> Result<(), String> {
    match entry(kind)?.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(format!("could not remove credential: {e}")),
    }
}

pub fn has_secret(kind: CredentialKind) -> bool {
    load_secret(kind).ok().flatten().is_some()
}

/// Redact any string that looks like a bearer/api key fragment for logs.
pub fn redact(s: &str) -> String {
    let mut out = s.to_string();
    for needle in ["sk-", "AIza", "Bearer "] {
        if let Some(i) = out.find(needle) {
            let end = (i + needle.len() + 8).min(out.len());
            out.replace_range(i..end, &format!("{needle}***"));
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_kinds() {
        assert_eq!(
            CredentialKind::parse("openai_api"),
            Some(CredentialKind::OpenaiApi)
        );
        assert_eq!(
            CredentialKind::parse("gemini"),
            Some(CredentialKind::GeminiApi)
        );
        assert!(CredentialKind::parse("codex").is_none());
    }

    #[test]
    fn redact_masks_fragments() {
        let s = redact("Authorization: Bearer sk-abcdefghijklmnop");
        assert!(!s.contains("abcdefgh"));
        assert!(s.contains("***"));
    }
}
