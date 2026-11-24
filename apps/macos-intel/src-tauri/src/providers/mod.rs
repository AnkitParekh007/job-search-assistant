//! Multi-provider AI runtime facade.
//!
//! Routes workflow execution to Claude Code, OpenAI Codex, OpenAI API,
//! Gemini, or Ollama while preserving a single invoke/event surface.

pub mod audit;
pub mod codex;
pub mod gemini;
pub mod inference;
pub mod ollama;
pub mod openai_api;
pub mod registry;
pub mod types;

use crate::bridge::Bridge;
use crate::db::{Db, RunSummary};
use crate::providers::codex::CodexBridge;
use crate::providers::inference::InferenceBridge;
use crate::providers::types::{ProviderId, StartOpts};
use serde_json::Value;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::AppHandle;

#[derive(Default, Clone)]
pub struct Runtime {
    pub claude: Bridge,
    pub codex: CodexBridge,
    pub inference: InferenceBridge,
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
            ProviderId::OpenaiApi => openai_api::start(
                &self.inference,
                app,
                db,
                opts.workspace,
                opts.workflow,
                opts.prompt,
                opts.model,
            ),
            ProviderId::Gemini => gemini::start(
                &self.inference,
                app,
                db,
                opts.workspace,
                opts.workflow,
                opts.prompt,
                opts.model,
            ),
            ProviderId::Ollama => {
                let endpoint = db.get_setting("ollama_endpoint");
                ollama::start(
                    &self.inference,
                    app,
                    db,
                    opts.workspace,
                    opts.workflow,
                    opts.prompt,
                    opts.model,
                    endpoint,
                )
            }
        }
    }

    fn route_inference(&self, run_id: &str) -> bool {
        self.inference.owns(run_id)
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
        } else if self.route_inference(&run_id) {
            self.inference.respond(run_id, request_id, allow)
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
        } else if self.route_inference(&run_id) {
            self.inference.send(run_id, text)
        } else {
            self.claude.send(app, db, run_id, text)
        }
    }

    pub fn finish(&self, run_id: &str) -> Result<(), String> {
        if self.codex.owns(run_id) {
            self.codex.finish(run_id)
        } else if self.route_inference(run_id) {
            self.inference.finish(run_id)
        } else {
            self.claude.finish(run_id)
        }
    }

    pub fn cancel(&self, app: AppHandle, db: Arc<Db>, run_id: String) -> Result<(), String> {
        if self.codex.owns(&run_id) {
            self.codex.cancel(app, db, run_id)
        } else if self.route_inference(&run_id) {
            self.inference.cancel(app, db, run_id)
        } else {
            self.claude.cancel(app, db, run_id)
        }
    }

    pub fn live_ids(&self) -> Vec<(String, String)> {
        let mut v = self.claude.live_ids();
        v.extend(self.codex.live_ids());
        v.extend(self.inference.live_ids());
        v
    }

    pub fn pending(&self, run_id: &str) -> Vec<Value> {
        if self.codex.owns(run_id) {
            self.codex.pending(run_id)
        } else if self.route_inference(run_id) {
            self.inference.pending(run_id)
        } else {
            self.claude.pending(run_id)
        }
    }

    pub fn shutdown(&self) {
        self.claude.shutdown();
        self.codex.shutdown();
        self.inference.shutdown();
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
