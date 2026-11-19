//! Multi-provider AI runtime facade.
//!
//! Routes workflow execution to Claude Code or OpenAI Codex while preserving
//! a single invoke/event surface for the React UI.

pub mod codex;
pub mod openai_api;
pub mod registry;
pub mod types;

use crate::bridge::Bridge;
use crate::db::{Db, RunSummary};
use crate::providers::codex::CodexBridge;
use crate::providers::types::{ProviderId, StartOpts};
use serde_json::Value;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::AppHandle;

#[derive(Default, Clone)]
pub struct Runtime {
    pub claude: Bridge,
    pub codex: CodexBridge,
}

impl Runtime {
    pub fn start(
        &self,
        app: AppHandle,
        db: Arc<Db>,
        opts: StartOpts,
    ) -> Result<RunSummary, String> {
        match opts.provider {
            ProviderId::Claude => {
                let mut summary = self.claude.start(
                    app,
                    db.clone(),
                    opts.workspace,
                    opts.workflow,
                    opts.prompt,
                    opts.model.clone(),
                    opts.resume,
                )?;
                summary.provider = Some(ProviderId::Claude.as_str().into());
                summary.model = opts.model;
                // Persist provider on the row (insert already happened; keep columns in sync).
                db.set_run_provider(
                    &summary.id,
                    ProviderId::Claude.as_str(),
                    summary.model.as_deref(),
                );
                Ok(summary)
            }
            ProviderId::Codex => self.codex.start(
                app,
                db,
                opts.workspace,
                opts.workflow,
                opts.prompt,
                opts.model,
                opts.resume,
            ),
            other => Err(format!(
                "{} is not available yet. Choose Claude Code or OpenAI Codex.",
                other.display_name()
            )),
        }
    }

    pub fn respond(
        &self,
        app: AppHandle,
        db: Arc<Db>,
        run_id: String,
        request_id: String,
        allow: bool,
        updated_input: Option<Value>,
        message: Option<String>,
        remember: bool,
    ) -> Result<(), String> {
        if self.codex.owns(&run_id) {
            self.codex.respond(
                app,
                db,
                run_id,
                request_id,
                allow,
                updated_input,
                message,
                remember,
            )
        } else {
            self.claude.respond(
                app,
                db,
                run_id,
                request_id,
                allow,
                updated_input,
                message,
                remember,
            )
        }
    }

    pub fn send(
        &self,
        app: AppHandle,
        db: Arc<Db>,
        run_id: String,
        text: String,
    ) -> Result<(), String> {
        if self.codex.owns(&run_id) {
            self.codex.send(app, db, run_id, text)
        } else {
            self.claude.send(app, db, run_id, text)
        }
    }

    pub fn finish(&self, run_id: &str) -> Result<(), String> {
        if self.codex.owns(run_id) {
            self.codex.finish(run_id)
        } else {
            self.claude.finish(run_id)
        }
    }

    pub fn cancel(&self, app: AppHandle, db: Arc<Db>, run_id: String) -> Result<(), String> {
        if self.codex.owns(&run_id) {
            self.codex.cancel(app, db, run_id)
        } else {
            self.claude.cancel(app, db, run_id)
        }
    }

    pub fn live_ids(&self) -> Vec<(String, String)> {
        let mut v = self.claude.live_ids();
        v.extend(self.codex.live_ids());
        v
    }

    pub fn pending(&self, run_id: &str) -> Vec<Value> {
        if self.codex.owns(run_id) {
            self.codex.pending(run_id)
        } else {
            self.claude.pending(run_id)
        }
    }

    pub fn shutdown(&self) {
        self.claude.shutdown();
        self.codex.shutdown();
    }

    #[allow(dead_code)]
    pub fn provider_of_live(&self, run_id: &str) -> Option<&'static str> {
        if self.codex.owns(run_id) {
            Some(ProviderId::Codex.as_str())
        } else if self.claude.live_ids().iter().any(|(id, _)| id == run_id) {
            Some(ProviderId::Claude.as_str())
        } else {
            None
        }
    }
}

pub fn start_opts(
    workspace: PathBuf,
    workflow: String,
    prompt: String,
    model: Option<String>,
    resume: Option<String>,
    provider: ProviderId,
) -> StartOpts {
    StartOpts {
        workspace,
        workflow,
        prompt,
        model,
        resume,
        provider,
    }
}
