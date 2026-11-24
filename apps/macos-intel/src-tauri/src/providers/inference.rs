//! Shared lifecycle for bounded inference runs (OpenAI API, Gemini API, Ollama).
//!
//! These providers stream text into the same run-event bus used by Claude/Codex.
//! They do not execute tools. Cancellation sets a flag checked between chunks.

use crate::bridge::{now_ms, RunEvent};
use crate::db::{Db, RunSummary};
use crate::orchestration::schemas::validate_structured;
use crate::orchestration::{
    build_inference_system_prompt, build_inference_user_prompt, expected_schema_name,
    workspace_excerpt,
};
use crate::providers::types::{kind, ProviderId};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread::JoinHandle;
use tauri::{AppHandle, Emitter};

pub struct LiveInference {
    pub cancel: Arc<AtomicBool>,
    pub seq: i64,
    pub status: String,
    pub handle: Option<JoinHandle<()>>,
}

#[derive(Default, Clone)]
pub struct InferenceBridge {
    runs: Arc<Mutex<HashMap<String, LiveInference>>>,
}

pub struct InferenceRequest {
    pub provider: ProviderId,
    pub workspace: PathBuf,
    pub workflow: String,
    pub prompt: String,
    pub model: Option<String>,
}

pub struct InferenceOutcome {
    pub text: String,
    pub usage: Option<Value>,
    pub model: Option<String>,
}

pub type StreamFn = Box<
    dyn FnOnce(
            String,
            String,
            Option<String>,
            Arc<AtomicBool>,
            Box<dyn FnMut(&str) + Send>,
        ) -> Result<InferenceOutcome, String>
        + Send,
>;

impl InferenceBridge {
    pub fn owns(&self, run_id: &str) -> bool {
        self.runs.lock().unwrap().contains_key(run_id)
    }

    pub fn live_ids(&self) -> Vec<(String, String)> {
        self.runs
            .lock()
            .unwrap()
            .iter()
            .map(|(id, l)| (id.clone(), l.status.clone()))
            .collect()
    }

    pub fn pending(&self, _run_id: &str) -> Vec<Value> {
        vec![]
    }

    pub fn emit(&self, app: &AppHandle, db: &Db, run_id: &str, ev_kind: &str, data: Value) {
        let seq = {
            let mut g = self.runs.lock().unwrap();
            match g.get_mut(run_id) {
                Some(l) => {
                    l.seq += 1;
                    l.seq
                }
                None => now_ms(),
            }
        };
        let ts = now_ms();
        db.add_event(run_id, seq, ts, ev_kind, &data.to_string());
        let _ = app.emit(
            "run-event",
            RunEvent {
                run_id: run_id.into(),
                seq,
                ts,
                kind: ev_kind.into(),
                data,
            },
        );
    }

    fn set_status(&self, app: &AppHandle, db: &Db, run_id: &str, status: &str) {
        if let Some(l) = self.runs.lock().unwrap().get_mut(run_id) {
            l.status = status.into();
        }
        db.set_run_status(run_id, status);
        let _ = app.emit("run-status", json!({"run_id": run_id, "status": status}));
    }

    pub fn start(
        &self,
        app: AppHandle,
        db: Arc<Db>,
        req: InferenceRequest,
        runner: StreamFn,
    ) -> Result<RunSummary, String> {
        if !req.workspace.join("CLAUDE.md").exists() {
            return Err(format!(
                "{} does not look like an Job Search Assistant workspace (no CLAUDE.md)",
                req.workspace.display()
            ));
        }

        let run_id = uuid::Uuid::new_v4().to_string();
        let session_id = uuid::Uuid::new_v4().to_string();
        let cancel = Arc::new(AtomicBool::new(false));
        let provider_id = req.provider;

        let summary = RunSummary {
            id: run_id.clone(),
            workflow: req.workflow.clone(),
            prompt: req.prompt.clone(),
            session_id,
            status: "running".into(),
            started_at: now_ms(),
            finished_at: None,
            cost_usd: None,
            summary: None,
            error: None,
            provider: Some(provider_id.as_str().into()),
            model: req.model.clone(),
        };
        db.insert_run(&summary, &req.workspace.to_string_lossy())
            .map_err(|e| e.to_string())?;

        self.runs.lock().unwrap().insert(
            run_id.clone(),
            LiveInference {
                cancel: cancel.clone(),
                seq: 0,
                status: "running".into(),
                handle: None,
            },
        );

        self.emit(
            &app,
            &db,
            &run_id,
            kind::STARTED,
            json!({
                "provider": provider_id.as_str(),
                "workflow": req.workflow,
                "mode": "structured_inference",
                "cwd": req.workspace,
            }),
        );

        let system = build_inference_system_prompt();
        let excerpt = workspace_excerpt(&req.workspace, 12_000);
        let user = if req.prompt.trim().len() > 40 {
            format!(
                "{}\n\nWorkspace excerpt (read-only):\n{}\n\nReturn ONLY JSON for schema {}.",
                req.prompt,
                excerpt,
                expected_schema_name(&req.workflow)
            )
        } else {
            build_inference_user_prompt(&req.workflow, &req.prompt, &excerpt)
        };

        let bridge = self.clone();
        let run_id_t = run_id.clone();
        let workflow = req.workflow.clone();
        let model = req.model.clone();

        let handle = std::thread::spawn(move || {
            let buf = Arc::new(Mutex::new(String::new()));
            let buf_cb = buf.clone();
            let cancel_cb = cancel.clone();
            let bridge_cb = bridge.clone();
            let app_cb = app.clone();
            let db_cb = db.clone();
            let run_cb = run_id_t.clone();
            let provider_label = provider_id.as_str().to_string();

            let result = runner(
                system,
                user,
                model,
                cancel.clone(),
                Box::new(move |delta: &str| {
                    if cancel_cb.load(Ordering::SeqCst) {
                        return;
                    }
                    if let Ok(mut g) = buf_cb.lock() {
                        g.push_str(delta);
                    }
                    bridge_cb.emit(
                        &app_cb,
                        &db_cb,
                        &run_cb,
                        kind::STREAMING,
                        json!({"delta": delta, "provider": provider_label}),
                    );
                }),
            );

            if cancel.load(Ordering::SeqCst) {
                bridge.set_status(&app, &db, &run_id_t, "cancelled");
                bridge.emit(
                    &app,
                    &db,
                    &run_id_t,
                    kind::CANCELLED,
                    json!({"reason": "user_cancel"}),
                );
                bridge.runs.lock().unwrap().remove(&run_id_t);
                return;
            }

            match result {
                Ok(outcome) => {
                    let text = if outcome.text.is_empty() {
                        buf.lock().unwrap().clone()
                    } else {
                        outcome.text
                    };
                    bridge.emit(
                        &app,
                        &db,
                        &run_id_t,
                        kind::AGENT_MESSAGE,
                        json!({"text": text, "role": "assistant"}),
                    );
                    if let Some(u) = outcome.usage {
                        bridge.emit(&app, &db, &run_id_t, kind::USAGE, u);
                    }
                    if let Some(m) = outcome.model.as_deref() {
                        db.set_run_provider(&run_id_t, provider_id.as_str(), Some(m));
                    }
                    match extract_json(&text) {
                        Some(v) => match validate_structured(&workflow, &v) {
                            Ok(()) => {
                                bridge.emit(
                                    &app,
                                    &db,
                                    &run_id_t,
                                    "structured.result",
                                    json!({"ok": true, "data": v}),
                                );
                                db.set_run_summary(
                                    &run_id_t,
                                    "Structured result ready (advisory only)",
                                );
                                bridge.set_status(&app, &db, &run_id_t, "completed");
                                bridge.emit(
                                    &app,
                                    &db,
                                    &run_id_t,
                                    kind::COMPLETED,
                                    json!({"structured": true}),
                                );
                            }
                            Err(e) => {
                                bridge.emit(
                                    &app,
                                    &db,
                                    &run_id_t,
                                    "structured.result",
                                    json!({"ok": false, "error": e, "raw_present": true}),
                                );
                                db.set_run_summary(
                                    &run_id_t,
                                    "Completed with schema warning — review raw output",
                                );
                                bridge.set_status(&app, &db, &run_id_t, "completed");
                                bridge.emit(
                                    &app,
                                    &db,
                                    &run_id_t,
                                    kind::COMPLETED,
                                    json!({"structured": false, "warning": e}),
                                );
                            }
                        },
                        None => {
                            db.set_run_summary(&run_id_t, "Completed (unstructured text)");
                            bridge.set_status(&app, &db, &run_id_t, "completed");
                            bridge.emit(
                                &app,
                                &db,
                                &run_id_t,
                                kind::COMPLETED,
                                json!({"structured": false}),
                            );
                        }
                    }
                }
                Err(e) => {
                    let safe = crate::security::credentials::redact(&e);
                    db.set_run_error(&run_id_t, &safe);
                    bridge.set_status(&app, &db, &run_id_t, "failed");
                    bridge.emit(&app, &db, &run_id_t, kind::FAILED, json!({"error": safe, "failure_class": super::audit::classify(&e)}));
                }
            }
            bridge.runs.lock().unwrap().remove(&run_id_t);
        });

        if let Some(l) = self.runs.lock().unwrap().get_mut(&run_id) {
            l.handle = Some(handle);
        }
        Ok(summary)
    }

    pub fn cancel(&self, app: AppHandle, db: Arc<Db>, run_id: String) -> Result<(), String> {
        let g = self.runs.lock().unwrap();
        let l = g.get(&run_id).ok_or("run is not live")?;
        l.cancel.store(true, Ordering::SeqCst);
        drop(g);
        self.set_status(&app, &db, &run_id, "cancelled");
        self.emit(
            &app,
            &db,
            &run_id,
            kind::CANCELLED,
            json!({"reason": "user_cancel"}),
        );
        Ok(())
    }

    pub fn finish(&self, run_id: &str) -> Result<(), String> {
        if let Some(mut l) = self.runs.lock().unwrap().remove(run_id) {
            l.cancel.store(true, Ordering::SeqCst);
            if let Some(h) = l.handle.take() {
                let _ = h.join();
            }
        }
        Ok(())
    }

    pub fn send(&self, _run_id: String, _text: String) -> Result<(), String> {
        Err(
            "This provider run is a single-turn inference task; start a new run to continue."
                .into(),
        )
    }

    pub fn respond(
        &self,
        _run_id: String,
        _request_id: String,
        _allow: bool,
    ) -> Result<(), String> {
        Err("Inference providers do not emit tool approvals. Use Claude Code or Codex for agentic tools.".into())
    }

    pub fn shutdown(&self) {
        let mut g = self.runs.lock().unwrap();
        for (_, l) in g.drain() {
            l.cancel.store(true, Ordering::SeqCst);
        }
    }
}

/// Pull a JSON object from model text (strips optional markdown fences).
pub fn extract_json(text: &str) -> Option<Value> {
    let t = text.trim();
    let t = t
        .strip_prefix("```json")
        .or_else(|| t.strip_prefix("```"))
        .map(|s| s.strip_suffix("```").unwrap_or(s).trim())
        .unwrap_or(t);
    if let Ok(v) = serde_json::from_str::<Value>(t) {
        return Some(v);
    }
    let start = t.find('{')?;
    let end = t.rfind('}')?;
    if end <= start {
        return None;
    }
    serde_json::from_str(&t[start..=end]).ok()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extract_raw_and_fenced() {
        let v = extract_json("```json\n{\"answer\":\"ok\"}\n```").unwrap();
        assert_eq!(v["answer"], "ok");
        let v2 = extract_json("Here:\n{\"a\":1}\n").unwrap();
        assert_eq!(v2["a"], 1);
    }
}
