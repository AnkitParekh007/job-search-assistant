//! Provider-neutral job-search task prompts and structured schemas.
//!
//! Inference providers (OpenAI API, Gemini API, Ollama) do not execute
//! upstream slash commands. The host builds a bounded, read-oriented prompt
//! and asks for schema-validated JSON. Model text is never treated as verified
//! candidate facts or as authority to run tools.

pub mod prompts;
pub mod schemas;

pub use prompts::{build_inference_system_prompt, build_inference_user_prompt, workspace_excerpt};
pub use schemas::expected_schema_name;
