//! OpenAI Codex app-server provider (JSON-RPC over stdio).
//!
//! Protocol: https://learn.chatgpt.com/docs/app-server
//! Approvals are server-initiated requests answered with `{ "decision": "accept" | ... }`.
//! Never uses unrestricted / unattended execution for feature parity.

use crate::bridge::{now_ms, RunEvent};
use crate::db::{Db, RunSummary};
use crate::env;
use crate::providers::types::{kind, ProviderId};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::io::{BufRead, BufReader, Write};
use std::path::PathBuf;
use std::process::{Child, ChildStdin, Stdio};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter};

struct PendingApproval {
    method: String,
    params: Value,
}

struct Live {
    stdin: Option<ChildStdin>,
    child: Child,
    seq: i64,
    status: String,
    next_id: i64,
    thread_id: Option<String>,
    turn_id: Option<String>,
    pending: HashMap<String, PendingApproval>,
    /// Accumulate agent message deltas keyed by item id.
    agent_buf: HashMap<String, String>,
}

#[derive(Default, Clone)]
pub struct CodexBridge {
    runs: Arc<Mutex<HashMap<String, Live>>>,
}

impl CodexBridge {
    fn emit(&self, app: &AppHandle, db: &Db, run_id: &str, kind: &str, data: Value) {
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
        db.add_event(run_id, seq, ts, kind, &data.to_string());
        let _ = app.emit(
            "run-event",
            RunEvent {
                run_id: run_id.into(),
                seq,
                ts,
                kind: kind.into(),
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

    fn write_raw(&self, run_id: &str, v: &Value) -> Result<(), String> {
        let mut g = self.runs.lock().unwrap();
        let l = g
            .get_mut(run_id)
            .ok_or("run is not live (it finished or the app restarted)")?;
        let stdin = l.stdin.as_mut().ok_or("session input is closed")?;
        writeln!(stdin, "{}", v).map_err(|e| e.to_string())?;
        stdin.flush().map_err(|e| e.to_string())
    }

    fn next_rpc_id(&self, run_id: &str) -> Result<i64, String> {
        let mut g = self.runs.lock().unwrap();
        let l = g.get_mut(run_id).ok_or("run is not live")?;
        let id = l.next_id;
        l.next_id += 1;
        Ok(id)
    }

    fn request(&self, run_id: &str, method: &str, params: Value) -> Result<i64, String> {
        let id = self.next_rpc_id(run_id)?;
        self.write_raw(
            run_id,
            &json!({"method": method, "id": id, "params": params}),
        )?;
        Ok(id)
    }

    pub fn start(
        &self,
        app: AppHandle,
        db: Arc<Db>,
        workspace: PathBuf,
        workflow: String,
        prompt: String,
        model: Option<String>,
        resume: Option<String>,
    ) -> Result<RunSummary, String> {
        let codex = env::which("codex").ok_or(
            "Codex CLI not found. Install it (see https://learn.chatgpt.com/docs/codex), sign in, then reopen Settings.",
        )?;
        if !workspace.join("CLAUDE.md").exists() {
            return Err(format!(
                "{} does not look like an AI Job Search workspace (no CLAUDE.md)",
                workspace.display()
            ));
        }

        let run_id = uuid::Uuid::new_v4().to_string();
        let mut cmd = env::command(&codex, &workspace);
        cmd.args(["app-server"]);
        cmd.stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());
        let mut child = cmd
            .spawn()
            .map_err(|e| format!("could not start codex app-server: {}", e))?;
        let stdin = child.stdin.take();
        let stdout = child.stdout.take().ok_or("no stdout")?;
        let stderr = child.stderr.take().ok_or("no stderr")?;

        // session_id is the Codex thread id once known; until then a placeholder UUID.
        let session_id = resume
            .clone()
            .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());

        let summary = RunSummary {
            id: run_id.clone(),
            workflow: workflow.clone(),
            prompt: prompt.clone(),
            session_id: session_id.clone(),
            status: "running".into(),
            started_at: now_ms(),
            finished_at: None,
            cost_usd: None,
            summary: None,
            error: None,
            provider: Some(ProviderId::Codex.as_str().into()),
            model: model.clone(),
        };
        db.insert_run(&summary, &workspace.to_string_lossy())
            .map_err(|e| e.to_string())?;

        self.runs.lock().unwrap().insert(
            run_id.clone(),
            Live {
                stdin,
                child,
                seq: 0,
                status: "running".into(),
                next_id: 1,
                thread_id: resume.clone(),
                turn_id: None,
                pending: HashMap::new(),
                agent_buf: HashMap::new(),
            },
        );

        self.emit(
            &app,
            &db,
            &run_id,
            kind::STARTED,
            json!({
                "provider": "codex",
                "workflow": workflow,
                "cwd": workspace,
            }),
        );

        // initialize
        self.write_raw(
            &run_id,
            &json!({
                "method": "initialize",
                "id": 0,
                "params": {
                    "clientInfo": {
                        "name": "ai_job_search_desktop",
                        "title": "AI Job Search",
                        "version": env!("CARGO_PKG_VERSION")
                    }
                }
            }),
        )?;

        // stderr
        {
            let (b, app2, db2, rid) = (self.clone(), app.clone(), db.clone(), run_id.clone());
            std::thread::spawn(move || {
                for line in BufReader::new(stderr).lines().map_while(Result::ok) {
                    b.emit(&app2, &db2, &rid, "stderr", json!({"line": line}));
                }
            });
        }

        // stdout reader / protocol loop
        {
            let (b, app2, db2, rid) = (self.clone(), app.clone(), db.clone(), run_id.clone());
            let ws = workspace.clone();
            let prompt_c = prompt.clone();
            let model_c = model.clone();
            let resume_c = resume.clone();
            std::thread::spawn(move || {
                for line in BufReader::new(stdout).lines().map_while(Result::ok) {
                    let msg: Value = match serde_json::from_str(&line) {
                        Ok(v) => v,
                        Err(_) => {
                            b.emit(&app2, &db2, &rid, "raw", json!({"line": line}));
                            continue;
                        }
                    };
                    if let Err(e) = b.handle_message(
                        &app2,
                        &db2,
                        &rid,
                        &ws,
                        &prompt_c,
                        model_c.as_deref(),
                        resume_c.as_deref(),
                        msg,
                    ) {
                        b.emit(
                            &app2,
                            &db2,
                            &rid,
                            kind::FAILED,
                            json!({"message": e}),
                        );
                        b.set_status(&app2, &db2, &rid, "failed");
                        db2.finish_run(&rid, "failed", None, None, Some(&e), now_ms());
                    }
                }
                let code = {
                    let mut g = b.runs.lock().unwrap();
                    g.get_mut(&rid)
                        .and_then(|l| l.child.wait().ok())
                        .and_then(|s| s.code())
                };
                let prev = b.status_of(&rid).unwrap_or_default();
                let fin = match prev.as_str() {
                    "cancelled" => "cancelled",
                    "awaiting_input" | "completed" => "completed",
                    "failed" => "failed",
                    _ if code == Some(0) => "completed",
                    _ => "failed",
                };
                if fin == "failed" && prev != "failed" {
                    db2.finish_run(
                        &rid,
                        fin,
                        None,
                        None,
                        Some("Codex app-server exited before reporting a result. See stderr in the log."),
                        now_ms(),
                    );
                } else {
                    db2.finish_run(&rid, fin, None, None, None, now_ms());
                }
                let k = match fin {
                    "cancelled" => kind::CANCELLED,
                    "failed" => kind::FAILED,
                    _ => kind::COMPLETED,
                };
                b.emit(
                    &app2,
                    &db2,
                    &rid,
                    k,
                    json!({"code": code, "status": fin, "provider": "codex"}),
                );
                b.emit(
                    &app2,
                    &db2,
                    &rid,
                    "bridge:exit",
                    json!({"code": code, "status": fin}),
                );
                b.set_status(&app2, &db2, &rid, fin);
                b.runs.lock().unwrap().remove(&rid);
            });
        }

        let _ = app.emit("run-status", json!({"run_id": run_id, "status": "running"}));
        Ok(summary)
    }

    fn status_of(&self, run_id: &str) -> Option<String> {
        self.runs
            .lock()
            .unwrap()
            .get(run_id)
            .map(|l| l.status.clone())
    }

    #[allow(clippy::too_many_arguments)]
    fn handle_message(
        &self,
        app: &AppHandle,
        db: &Db,
        run_id: &str,
        workspace: &PathBuf,
        prompt: &str,
        model: Option<&str>,
        resume: Option<&str>,
        msg: Value,
    ) -> Result<(), String> {
        // Server-initiated request (has method + id, no result)
        if msg.get("method").is_some() && msg.get("id").is_some() && msg.get("result").is_none() {
            let method = msg.get("method").and_then(|m| m.as_str()).unwrap_or("");
            if method.ends_with("/requestApproval")
                || method == "tool/requestUserInput"
                || method == "item/tool/requestUserInput"
                || method == "mcpServer/elicitation/request"
            {
                self.on_server_request(app, db, run_id, msg)?;
                return Ok(());
            }
            // Other server requests — decline safely if unknown
            if let Some(id) = msg.get("id") {
                let _ = self.write_raw(
                    run_id,
                    &json!({"id": id, "error": {"code": -32601, "message": format!("unsupported server request: {method}")}}),
                );
            }
            return Ok(());
        }

        // Notification (method, no id)
        if let Some(method) = msg.get("method").and_then(|m| m.as_str()) {
            if msg.get("id").is_none() {
                self.on_notification(app, db, run_id, method, msg.get("params").cloned().unwrap_or(json!({})))?;
                return Ok(());
            }
        }

        // Response to our request
        if let Some(id) = msg.get("id") {
            if msg.get("error").is_some() {
                let err = msg
                    .pointer("/error/message")
                    .and_then(|m| m.as_str())
                    .unwrap_or("Codex RPC error")
                    .to_string();
                self.emit(app, db, run_id, kind::FAILED, json!({"message": err, "raw": msg}));
                self.set_status(app, db, run_id, "failed");
                db.finish_run(run_id, "failed", None, None, Some(&err), now_ms());
                return Ok(());
            }
            let id_n = id.as_i64().unwrap_or(-1);
            if id_n == 0 {
                // initialize succeeded
                self.write_raw(run_id, &json!({"method": "initialized", "params": {}}))?;
                self.emit(
                    app,
                    db,
                    run_id,
                    "bridge:initialized",
                    json!({"provider": "codex", "result": msg.get("result")}),
                );
                // Start or resume thread
                if let Some(tid) = resume {
                    let _ = self.request(
                        run_id,
                        "thread/resume",
                        json!({"threadId": tid}),
                    )?;
                } else {
                    let mut params = json!({
                        "cwd": workspace,
                        "approvalPolicy": "on-request",
                        "sandbox": "workspace-write",
                    });
                    if let Some(m) = model.filter(|s| !s.is_empty()) {
                        params["model"] = json!(m);
                    }
                    let _ = self.request(run_id, "thread/start", params)?;
                }
                return Ok(());
            }

            // thread/start or thread/resume response
            if let Some(tid) = msg.pointer("/result/thread/id").and_then(|t| t.as_str()) {
                {
                    let mut g = self.runs.lock().unwrap();
                    if let Some(l) = g.get_mut(run_id) {
                        l.thread_id = Some(tid.to_string());
                    }
                }
                db.set_run_session(run_id, tid);
                let mut turn_params = json!({
                    "threadId": tid,
                    "input": [{"type": "text", "text": prompt}],
                    "approvalPolicy": "on-request",
                    "cwd": workspace,
                    "sandboxPolicy": {"type": "workspaceWrite"}
                });
                if let Some(m) = model.filter(|s| !s.is_empty()) {
                    turn_params["model"] = json!(m);
                }
                let _ = self.request(run_id, "turn/start", turn_params)?;
                return Ok(());
            }

            // turn/start response — capture turn id
            if let Some(turn_id) = msg.pointer("/result/turn/id").and_then(|t| t.as_str()) {
                let mut g = self.runs.lock().unwrap();
                if let Some(l) = g.get_mut(run_id) {
                    l.turn_id = Some(turn_id.to_string());
                }
            }
        }
        Ok(())
    }

    fn on_server_request(
        &self,
        app: &AppHandle,
        db: &Db,
        run_id: &str,
        msg: Value,
    ) -> Result<(), String> {
        let request_id = msg
            .get("id")
            .map(|id| match id {
                Value::Number(n) => n.to_string(),
                Value::String(s) => s.clone(),
                other => other.to_string(),
            })
            .unwrap_or_default();
        let method = msg
            .get("method")
            .and_then(|m| m.as_str())
            .unwrap_or("")
            .to_string();
        let params = msg.get("params").cloned().unwrap_or(json!({}));

        let (tool_name, input, display) = map_approval_to_ui(&method, &params);

        {
            let mut g = self.runs.lock().unwrap();
            if let Some(l) = g.get_mut(run_id) {
                l.pending.insert(
                    request_id.clone(),
                    PendingApproval {
                        method: method.clone(),
                        params: params.clone(),
                    },
                );
            }
        }

        let pending_payload = json!({
            "request_id": request_id,
            "request": {
                "tool_name": tool_name,
                "input": input,
                "display_name": display,
                "provider": "codex",
                "approval_method": method,
                "raw_params": params,
            }
        });

        self.emit(app, db, run_id, kind::APPROVAL_REQUIRED, pending_payload.clone());
        self.emit(app, db, run_id, "control:can_use_tool", pending_payload);
        self.set_status(app, db, run_id, "awaiting_approval");
        Ok(())
    }

    fn on_notification(
        &self,
        app: &AppHandle,
        db: &Db,
        run_id: &str,
        method: &str,
        params: Value,
    ) -> Result<(), String> {
        match method {
            "turn/started" => {
                if let Some(tid) = params.pointer("/turn/id").and_then(|t| t.as_str()) {
                    let mut g = self.runs.lock().unwrap();
                    if let Some(l) = g.get_mut(run_id) {
                        l.turn_id = Some(tid.to_string());
                    }
                }
                self.emit(app, db, run_id, "turn:started", params);
            }
            "turn/completed" => {
                let status = params
                    .pointer("/turn/status")
                    .and_then(|s| s.as_str())
                    .unwrap_or("completed");
                let ok = status == "completed";
                let interrupted = status == "interrupted";
                let text = params
                    .pointer("/turn/error/message")
                    .and_then(|m| m.as_str())
                    .map(|s| s.to_string());
                if interrupted {
                    self.emit(app, db, run_id, kind::CANCELLED, params.clone());
                    self.emit(
                        app,
                        db,
                        run_id,
                        "result:error",
                        json!({"subtype": "interrupted", "is_error": true, "result": text}),
                    );
                    self.set_status(app, db, run_id, "cancelled");
                    db.finish_run(run_id, "cancelled", None, None, text.as_deref(), now_ms());
                } else if ok {
                    self.emit(app, db, run_id, kind::COMPLETED, params.clone());
                    self.emit(
                        app,
                        db,
                        run_id,
                        "result:success",
                        json!({"subtype": "success", "is_error": false, "result": "Turn completed."}),
                    );
                    self.set_status(app, db, run_id, "awaiting_input");
                    db.finish_run(run_id, "awaiting_input", None, Some("Turn completed."), None, now_ms());
                } else {
                    let err = text.unwrap_or_else(|| format!("Turn ended with status {status}"));
                    self.emit(app, db, run_id, kind::FAILED, params.clone());
                    self.emit(
                        app,
                        db,
                        run_id,
                        "result:error",
                        json!({"subtype": "error", "is_error": true, "result": err}),
                    );
                    self.set_status(app, db, run_id, "failed");
                    db.finish_run(run_id, "failed", None, None, Some(&err), now_ms());
                }
            }
            "item/agentMessage/delta" => {
                let item_id = params
                    .get("itemId")
                    .or_else(|| params.pointer("/item/id"))
                    .and_then(|s| s.as_str())
                    .unwrap_or("msg")
                    .to_string();
                let delta = params
                    .get("delta")
                    .and_then(|d| d.as_str())
                    .or_else(|| params.pointer("/delta/text").and_then(|t| t.as_str()))
                    .unwrap_or("");
                if !delta.is_empty() {
                    let mut g = self.runs.lock().unwrap();
                    if let Some(l) = g.get_mut(run_id) {
                        l.agent_buf
                            .entry(item_id)
                            .or_default()
                            .push_str(delta);
                    }
                }
            }
            "item/completed" => {
                let item = params.get("item").cloned().unwrap_or(params.clone());
                let item_type = item.get("type").and_then(|t| t.as_str()).unwrap_or("");
                if item_type == "agentMessage" || item.get("text").is_some() {
                    let item_id = item
                        .get("id")
                        .and_then(|s| s.as_str())
                        .unwrap_or("")
                        .to_string();
                    let text = {
                        let mut g = self.runs.lock().unwrap();
                        let buffered = g
                            .get_mut(run_id)
                            .and_then(|l| l.agent_buf.remove(&item_id))
                            .unwrap_or_default();
                        if !buffered.is_empty() {
                            buffered
                        } else {
                            item.get("text")
                                .and_then(|t| t.as_str())
                                .unwrap_or("")
                                .to_string()
                        }
                    };
                    if !text.is_empty() {
                        let data = json!({"message": {"role": "assistant", "content": [{"type": "text", "text": text}]}});
                        self.emit(app, db, run_id, kind::AGENT_MESSAGE, data.clone());
                        self.emit(app, db, run_id, "assistant", data);
                    }
                } else if item_type == "commandExecution" || item_type == "fileChange" {
                    let name = if item_type == "fileChange" {
                        "Write"
                    } else {
                        "Bash"
                    };
                    let id = item
                        .get("id")
                        .and_then(|s| s.as_str())
                        .unwrap_or("tool")
                        .to_string();
                    let status = item.get("status").and_then(|s| s.as_str()).unwrap_or("");
                    let output = item
                        .get("aggregatedOutput")
                        .or_else(|| item.get("output"))
                        .cloned()
                        .unwrap_or(json!(""));
                    self.emit(
                        app,
                        db,
                        run_id,
                        kind::TOOL_COMPLETED,
                        json!({"id": id, "name": name, "status": status, "output": output, "item": item}),
                    );
                } else {
                    self.emit(app, db, run_id, "item:completed", params);
                }
            }
            "item/started" => {
                let item = params.get("item").cloned().unwrap_or(params.clone());
                let item_type = item.get("type").and_then(|t| t.as_str()).unwrap_or("");
                let id = item
                    .get("id")
                    .and_then(|s| s.as_str())
                    .unwrap_or("")
                    .to_string();
                if item_type == "commandExecution" {
                    let cmd = item
                        .get("command")
                        .cloned()
                        .unwrap_or_else(|| json!(item.get("cmd").cloned().unwrap_or(json!(""))));
                    let data = json!({"message": {"content": [{"type": "tool_use", "id": id, "name": "Bash", "input": {"command": cmd}}]}});
                    self.emit(app, db, run_id, kind::TOOL_STARTED, data.clone());
                    self.emit(app, db, run_id, "assistant", data);
                } else if item_type == "fileChange" {
                    let changes = item.get("changes").cloned().unwrap_or(json!([]));
                    let data = json!({"message": {"content": [{"type": "tool_use", "id": id, "name": "Write", "input": {"changes": changes}}]}});
                    self.emit(app, db, run_id, kind::TOOL_STARTED, data.clone());
                    self.emit(app, db, run_id, "assistant", data);
                } else {
                    self.emit(app, db, run_id, "item:started", params);
                }
            }
            "item/commandExecution/outputDelta" => {
                self.emit(app, db, run_id, kind::TOOL_OUTPUT, params);
            }
            "error" => {
                let message = params
                    .pointer("/error/message")
                    .or_else(|| params.get("message"))
                    .and_then(|m| m.as_str())
                    .unwrap_or("Codex error")
                    .to_string();
                let will_retry = params
                    .get("willRetry")
                    .and_then(|b| b.as_bool())
                    .unwrap_or(false);
                self.emit(
                    app,
                    db,
                    run_id,
                    if will_retry { "stderr" } else { kind::FAILED },
                    json!({"message": message, "params": params}),
                );
                if !will_retry {
                    self.set_status(app, db, run_id, "failed");
                    db.finish_run(run_id, "failed", None, None, Some(&message), now_ms());
                }
            }
            "account/login/completed" => {
                self.emit(app, db, run_id, "account:login_completed", params);
            }
            "serverRequest/resolved" => {
                self.emit(app, db, run_id, "bridge:answered", json!({
                    "request_id": params.get("requestId").cloned().unwrap_or(json!(null)),
                    "provider": "codex"
                }));
            }
            _ => {
                // Keep protocol continuity for debugging without flooding the UI.
                if method.starts_with("item/") || method.starts_with("thread/") || method.starts_with("turn/") {
                    self.emit(app, db, run_id, &format!("codex:{method}"), params);
                }
            }
        }
        Ok(())
    }

    pub fn respond(
        &self,
        app: AppHandle,
        db: Arc<Db>,
        run_id: String,
        request_id: String,
        allow: bool,
        _updated_input: Option<Value>,
        message: Option<String>,
        remember: bool,
    ) -> Result<(), String> {
        let pending = {
            let mut g = self.runs.lock().unwrap();
            let l = g.get_mut(&run_id).ok_or("run is not live")?;
            l.pending
                .remove(&request_id)
                .ok_or("that request was already answered")?
        };

        let decision: Value = if allow {
            if remember {
                json!("acceptForSession")
            } else {
                json!("accept")
            }
        } else if message.as_deref() == Some("cancel") {
            json!("cancel")
        } else {
            json!("decline")
        };

        // Parse request id back to number when possible (JSON-RPC ids are usually numbers).
        let id_val = request_id
            .parse::<i64>()
            .map(|n| json!(n))
            .unwrap_or_else(|_| json!(request_id));

        let result = if pending.method == "tool/requestUserInput"
            || pending.method == "item/tool/requestUserInput"
        {
            // Best-effort: accept with empty answers if the UI did not reshape.
            if allow {
                json!({"answers": _updated_input.unwrap_or(json!({}))})
            } else {
                json!({"declined": true})
            }
        } else {
            json!({"decision": decision})
        };

        self.write_raw(&run_id, &json!({"id": id_val, "result": result}))?;
        self.emit(
            &app,
            &db,
            &run_id,
            "bridge:answered",
            json!({"request_id": request_id, "allow": allow, "provider": "codex", "method": pending.method}),
        );
        let still = self
            .runs
            .lock()
            .unwrap()
            .get(&run_id)
            .map(|l| !l.pending.is_empty())
            .unwrap_or(false);
        if !still {
            self.set_status(&app, &db, &run_id, "running");
        }
        Ok(())
    }

    pub fn send(
        &self,
        app: AppHandle,
        db: Arc<Db>,
        run_id: String,
        text: String,
    ) -> Result<(), String> {
        let (thread_id, _) = {
            let g = self.runs.lock().unwrap();
            let l = g.get(&run_id).ok_or("run is not live")?;
            (
                l.thread_id.clone().ok_or("Codex thread is not ready yet")?,
                l.turn_id.clone(),
            )
        };
        let _ = self.request(
            &run_id,
            "turn/start",
            json!({
                "threadId": thread_id,
                "input": [{"type": "text", "text": text}],
                "approvalPolicy": "on-request",
                "sandboxPolicy": {"type": "workspaceWrite"}
            }),
        )?;
        self.emit(
            &app,
            &db,
            &run_id,
            "bridge:user_message",
            json!({"text": text}),
        );
        self.set_status(&app, &db, &run_id, "running");
        Ok(())
    }

    pub fn finish(&self, run_id: &str) -> Result<(), String> {
        let mut g = self.runs.lock().unwrap();
        let l = g.get_mut(run_id).ok_or("run is not live")?;
        l.stdin = None;
        l.status = "completed".into();
        Ok(())
    }

    pub fn cancel(&self, app: AppHandle, db: Arc<Db>, run_id: String) -> Result<(), String> {
        let (thread_id, turn_id) = {
            let g = self.runs.lock().unwrap();
            let l = g.get(&run_id).ok_or("run is not live")?;
            (l.thread_id.clone(), l.turn_id.clone())
        };
        if let (Some(tid), Some(turn)) = (thread_id, turn_id) {
            let _ = self.request(
                &run_id,
                "turn/interrupt",
                json!({"threadId": tid, "turnId": turn}),
            );
        }
        self.set_status(&app, &db, &run_id, "cancelled");
        let runs = self.runs.clone();
        let rid = run_id.clone();
        std::thread::spawn(move || {
            std::thread::sleep(std::time::Duration::from_millis(1500));
            if let Some(l) = runs.lock().unwrap().get_mut(&rid) {
                l.stdin = None;
                let _ = l.child.kill();
            }
        });
        Ok(())
    }

    pub fn owns(&self, run_id: &str) -> bool {
        self.runs.lock().unwrap().contains_key(run_id)
    }

    pub fn live_ids(&self) -> Vec<(String, String)> {
        self.runs
            .lock()
            .unwrap()
            .iter()
            .filter(|(_, v)| {
                matches!(
                    v.status.as_str(),
                    "running" | "starting" | "awaiting_approval" | "awaiting_input"
                )
            })
            .map(|(k, v)| (k.clone(), v.status.clone()))
            .collect()
    }

    pub fn pending(&self, run_id: &str) -> Vec<Value> {
        self.runs
            .lock()
            .unwrap()
            .get(run_id)
            .map(|l| {
                l.pending
                    .iter()
                    .map(|(k, v)| {
                        let (tool_name, input, display) = map_approval_to_ui(&v.method, &v.params);
                        json!({
                            "request_id": k,
                            "request": {
                                "tool_name": tool_name,
                                "input": input,
                                "display_name": display,
                                "provider": "codex",
                                "approval_method": v.method,
                                "raw_params": v.params,
                            }
                        })
                    })
                    .collect()
            })
            .unwrap_or_default()
    }

    pub fn shutdown(&self) {
        for (_, l) in self.runs.lock().unwrap().iter_mut() {
            l.stdin = None;
            let _ = l.child.kill();
        }
    }
}

fn map_approval_to_ui(method: &str, params: &Value) -> (String, Value, String) {
    if method.contains("fileChange") {
        (
            "Write".into(),
            json!({
                "file_path": params.get("grantRoot").cloned().unwrap_or(json!("")),
                "changes": params.get("changes").cloned().unwrap_or(json!([])),
                "reason": params.get("reason").cloned().unwrap_or(json!(null)),
            }),
            "File change".into(),
        )
    } else if method.contains("commandExecution") {
        let cmd = params.get("command").cloned().unwrap_or(json!(""));
        (
            "Bash".into(),
            json!({
                "command": cmd,
                "cwd": params.get("cwd").cloned().unwrap_or(json!("")),
                "reason": params.get("reason").cloned().unwrap_or(json!(null)),
            }),
            "Command execution".into(),
        )
    } else if method.contains("permissions") {
        (
            "AskUserQuestion".into(),
            json!({
                "questions": [{
                    "question": params.get("reason").and_then(|r| r.as_str()).unwrap_or("Grant requested permissions?"),
                    "options": [{"label": "Allow"}, {"label": "Deny"}]
                }],
                "raw": params,
            }),
            "Permissions".into(),
        )
    } else {
        (
            "AskUserQuestion".into(),
            params.clone(),
            "User input".into(),
        )
    }
}

/// One-shot JSON-RPC helper for Settings (account/read, login, model/list).
pub fn oneshot_rpc(method: &str, params: Value, timeout_ms: u64) -> Result<Value, String> {
    let codex = env::which("codex").ok_or("Codex CLI not found")?;
    let mut cmd = env::command(&codex, &env::home());
    cmd.args(["app-server"]);
    cmd.stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::null());
    let mut child = cmd.spawn().map_err(|e| e.to_string())?;
    let mut stdin = child.stdin.take().ok_or("no stdin")?;
    let stdout = child.stdout.take().ok_or("no stdout")?;

    writeln!(
        stdin,
        "{}",
        json!({
            "method": "initialize",
            "id": 0,
            "params": {
                "clientInfo": {
                    "name": "ai_job_search_desktop",
                    "title": "AI Job Search",
                    "version": env!("CARGO_PKG_VERSION")
                }
            }
        })
    )
    .map_err(|e| e.to_string())?;
    stdin.flush().map_err(|e| e.to_string())?;

    let reader = BufReader::new(stdout);
    let start = std::time::Instant::now();
    let mut initialized = false;
    let mut result: Option<Value> = None;

    for line in reader.lines() {
        if start.elapsed().as_millis() as u64 > timeout_ms {
            let _ = child.kill();
            return Err("timed out talking to Codex app-server".into());
        }
        let line = line.map_err(|e| e.to_string())?;
        let msg: Value = match serde_json::from_str(&line) {
            Ok(v) => v,
            Err(_) => continue,
        };
        if !initialized {
            if msg.get("id") == Some(&json!(0)) {
                if msg.get("error").is_some() {
                    let _ = child.kill();
                    return Err(msg
                        .pointer("/error/message")
                        .and_then(|m| m.as_str())
                        .unwrap_or("initialize failed")
                        .into());
                }
                writeln!(stdin, "{}", json!({"method": "initialized", "params": {}}))
                    .map_err(|e| e.to_string())?;
                writeln!(
                    stdin,
                    "{}",
                    json!({"method": method, "id": 1, "params": params})
                )
                .map_err(|e| e.to_string())?;
                stdin.flush().map_err(|e| e.to_string())?;
                initialized = true;
            }
            continue;
        }
        if msg.get("id") == Some(&json!(1)) {
            if let Some(err) = msg.get("error") {
                let _ = child.kill();
                return Err(err
                    .get("message")
                    .and_then(|m| m.as_str())
                    .unwrap_or("RPC error")
                    .into());
            }
            result = msg.get("result").cloned();
            break;
        }
        // Login may complete via notification before result — keep reading briefly.
        if method == "account/login/start" {
            if msg.get("method").and_then(|m| m.as_str()) == Some("account/login/completed") {
                result = msg.get("params").cloned();
                break;
            }
        }
    }
    let _ = child.kill();
    result.ok_or_else(|| "no result from Codex".into())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn maps_command_approval() {
        let (name, input, _) = map_approval_to_ui(
            "item/commandExecution/requestApproval",
            &json!({"command": "ls", "cwd": "/tmp", "reason": "list"}),
        );
        assert_eq!(name, "Bash");
        assert_eq!(input["command"], "ls");
    }

    #[test]
    fn maps_file_approval() {
        let (name, _, _) =
            map_approval_to_ui("item/fileChange/requestApproval", &json!({"grantRoot": "/w"}));
        assert_eq!(name, "Write");
    }
}
