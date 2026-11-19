//! Claude Code execution bridge.
//!
//! Spawns `claude -p` with stream-json in both directions and speaks the same
//! control protocol the official Agent SDK uses (verified against Claude Code
//! 2.1.311): an `initialize` control_request, then `can_use_tool`
//! control_requests that the UI must answer. Nothing is auto-approved here:
//! upstream `.claude/settings.json` allow/ask/deny rules still apply first, and
//! every remaining prompt goes to the user. No permission-bypass flag is used.

use crate::db::{Db, RunSummary};
use crate::env;
use serde::Serialize;
use serde_json::{json, Value};
use std::collections::{HashMap, HashSet};
use std::io::{BufRead, BufReader, Write};
use std::path::PathBuf;
use std::process::{Child, ChildStdin, Stdio};
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter};

pub fn now_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

#[derive(Serialize, Clone)]
pub struct RunEvent {
    pub run_id: String,
    pub seq: i64,
    pub ts: i64,
    pub kind: String,
    pub data: Value,
}

struct Live {
    stdin: Option<ChildStdin>,
    child: Child,
    seq: i64,
    status: String,
    allowed_tools: HashSet<String>,
    pending: HashMap<String, Value>,
}

#[derive(Default, Clone)]
pub struct Bridge {
    runs: Arc<Mutex<HashMap<String, Live>>>,
}

/// Remove bulky / opaque fields before persisting or emitting.
pub fn slim(mut v: Value) -> Value {
    if let Some(content) = v
        .pointer_mut("/message/content")
        .and_then(|c| c.as_array_mut())
    {
        content.retain(|b| {
            b.get("type").and_then(|t| t.as_str()) != Some("thinking")
                || b.get("thinking")
                    .and_then(|t| t.as_str())
                    .map(|s| !s.is_empty())
                    .unwrap_or(false)
        });
        for b in content.iter_mut() {
            if let Some(o) = b.as_object_mut() {
                o.remove("signature");
                if let Some(Value::String(s)) = o.get_mut("content") {
                    if s.len() > 20_000 {
                        s.truncate(20_000);
                        s.push_str("\n…[truncated]");
                    }
                }
            }
        }
    }
    if v.get("type").and_then(|t| t.as_str()) == Some("system")
        && v.get("subtype").and_then(|t| t.as_str()) == Some("init")
    {
        if let Some(o) = v.as_object_mut() {
            let n = o
                .get("tools")
                .and_then(|t| t.as_array())
                .map(|a| a.len())
                .unwrap_or(0);
            o.remove("tools");
            o.insert("tool_count".into(), json!(n));
            if let Some(Value::Array(cmds)) = o.get_mut("slash_commands") {
                cmds.truncate(200);
            }
        }
    }
    v
}

/// Classify a raw stream-json line into a coarse UI kind.
pub fn kind_of(v: &Value) -> String {
    let t = v.get("type").and_then(|t| t.as_str()).unwrap_or("unknown");
    match t {
        "system" => format!(
            "system:{}",
            v.get("subtype").and_then(|s| s.as_str()).unwrap_or("")
        ),
        "control_request" => format!(
            "control:{}",
            v.pointer("/request/subtype")
                .and_then(|s| s.as_str())
                .unwrap_or("")
        ),
        "result" => format!(
            "result:{}",
            v.get("subtype").and_then(|s| s.as_str()).unwrap_or("")
        ),
        _ => t.to_string(),
    }
}

impl Bridge {
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
        if kind != "system:thinking_tokens" && kind != "stream_event" {
            db.add_event(run_id, seq, ts, kind, &data.to_string());
        }
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

    fn write_line(&self, run_id: &str, v: &Value) -> Result<(), String> {
        let mut g = self.runs.lock().unwrap();
        let l = g
            .get_mut(run_id)
            .ok_or("run is not live (it finished or the app restarted)")?;
        let stdin = l.stdin.as_mut().ok_or("session input is closed")?;
        writeln!(stdin, "{}", v).map_err(|e| e.to_string())?;
        stdin.flush().map_err(|e| e.to_string())
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
        let claude = env::which("claude").ok_or("Claude Code CLI not found. Install it from https://claude.com/claude-code and sign in, then reopen Settings.")?;
        if !workspace.join("CLAUDE.md").exists() {
            return Err(format!(
                "{} does not look like an AI Job Search workspace (no CLAUDE.md)",
                workspace.display()
            ));
        }
        let run_id = uuid::Uuid::new_v4().to_string();
        let session_id = resume
            .clone()
            .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
        let mut cmd = env::command(&claude, &workspace);
        cmd.args([
            "-p",
            "--input-format",
            "stream-json",
            "--output-format",
            "stream-json",
            "--verbose",
            "--permission-prompts",
            "host",
            "--permission-prompt-tool",
            "stdio",
        ]);
        match &resume {
            Some(s) => {
                cmd.args(["--resume", s]);
            }
            None => {
                cmd.args(["--session-id", &session_id]);
            }
        }
        if let Some(m) = model.filter(|m| !m.is_empty()) {
            cmd.args(["--model", &m]);
        }
        cmd.stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());
        let mut child = cmd
            .spawn()
            .map_err(|e| format!("could not start claude: {}", e))?;
        let stdin = child.stdin.take();
        let stdout = child.stdout.take().ok_or("no stdout")?;
        let stderr = child.stderr.take().ok_or("no stderr")?;

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
                allowed_tools: HashSet::new(),
                pending: HashMap::new(),
            },
        );

        self.write_line(&run_id, &json!({"type":"control_request","request_id":format!("init-{}", run_id),"request":{"subtype":"initialize","hooks":null}}))?;
        self.write_line(
            &run_id,
            &json!({"type":"user","message":{"role":"user","content": prompt}}),
        )?;

        // stderr reader
        {
            let (b, app2, db2, rid) = (self.clone(), app.clone(), db.clone(), run_id.clone());
            std::thread::spawn(move || {
                for line in BufReader::new(stderr).lines().map_while(Result::ok) {
                    b.emit(&app2, &db2, &rid, "stderr", json!({"line": line}));
                }
            });
        }
        // stdout reader
        {
            let (b, app2, db2, rid) = (self.clone(), app.clone(), db.clone(), run_id.clone());
            std::thread::spawn(move || {
                for line in BufReader::new(stdout).lines().map_while(Result::ok) {
                    let v: Value = match serde_json::from_str(&line) {
                        Ok(v) => v,
                        Err(_) => {
                            b.emit(&app2, &db2, &rid, "raw", json!({"line": line}));
                            continue;
                        }
                    };
                    let kind = kind_of(&v);
                    if kind == "control:can_use_tool" {
                        b.on_permission(&app2, &db2, &rid, v);
                        continue;
                    }
                    if kind == "control_response"
                        && v.pointer("/response/request_id")
                            .and_then(|s| s.as_str())
                            .map(|s| s.starts_with("init-"))
                            .unwrap_or(false)
                    {
                        let cmds = v
                            .pointer("/response/response/commands")
                            .cloned()
                            .unwrap_or(json!([]));
                        b.emit(
                            &app2,
                            &db2,
                            &rid,
                            "bridge:initialized",
                            json!({"commands": cmds}),
                        );
                        continue;
                    }
                    if kind.starts_with("result:") {
                        let cost = v.get("total_cost_usd").and_then(|c| c.as_f64());
                        let is_err = v.get("is_error").and_then(|e| e.as_bool()).unwrap_or(false)
                            || kind != "result:success";
                        let text = v
                            .get("result")
                            .and_then(|r| r.as_str())
                            .map(|s| s.chars().take(2000).collect::<String>());
                        db2.finish_run(
                            &rid,
                            if is_err { "failed" } else { "awaiting_input" },
                            cost,
                            text.as_deref(),
                            if is_err { text.as_deref() } else { None },
                            now_ms(),
                        );
                        b.emit(&app2, &db2, &rid, &kind, slim(v));
                        b.set_status(
                            &app2,
                            &db2,
                            &rid,
                            if is_err { "failed" } else { "awaiting_input" },
                        );
                        continue;
                    }
                    b.emit(&app2, &db2, &rid, &kind, slim(v));
                }
                // process ended
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
                db2.finish_run(&rid, fin, None, None, if fin == "failed" { Some("Claude Code exited before reporting a result. See the stderr lines in the log.") } else { None }, now_ms());
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

    fn on_permission(&self, app: &AppHandle, db: &Db, run_id: &str, v: Value) {
        let request_id = v
            .get("request_id")
            .and_then(|s| s.as_str())
            .unwrap_or("")
            .to_string();
        let req = v.get("request").cloned().unwrap_or(json!({}));
        let tool = req
            .get("tool_name")
            .and_then(|s| s.as_str())
            .unwrap_or("")
            .to_string();
        let remembered = self
            .runs
            .lock()
            .unwrap()
            .get(run_id)
            .map(|l| l.allowed_tools.contains(&tool))
            .unwrap_or(false);
        // "Allow for this run" only ever applies to read-only tools; questions always go to the user.
        if remembered && is_read_only(&tool) {
            let input = req.get("input").cloned().unwrap_or(json!({}));
            let _ = self.reply(
                run_id,
                &request_id,
                json!({"behavior":"allow","updatedInput": input}),
            );
            self.emit(
                app,
                db,
                run_id,
                "bridge:auto_allowed",
                json!({"tool": tool, "reason": "allowed earlier in this run"}),
            );
            return;
        }
        if let Some(l) = self.runs.lock().unwrap().get_mut(run_id) {
            l.pending.insert(request_id.clone(), req.clone());
        }
        self.emit(
            app,
            db,
            run_id,
            "control:can_use_tool",
            json!({"request_id": request_id, "request": req}),
        );
        self.set_status(app, db, run_id, "awaiting_approval");
    }

    fn reply(&self, run_id: &str, request_id: &str, response: Value) -> Result<(), String> {
        self.write_line(run_id, &json!({"type":"control_response","response":{"subtype":"success","request_id":request_id,"response":response}}))
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
        let req = {
            let mut g = self.runs.lock().unwrap();
            let l = g.get_mut(&run_id).ok_or("run is not live")?;
            l.pending
                .remove(&request_id)
                .ok_or("that request was already answered")?
        };
        let tool = req
            .get("tool_name")
            .and_then(|s| s.as_str())
            .unwrap_or("")
            .to_string();
        let resp = if allow {
            let input =
                updated_input.unwrap_or_else(|| req.get("input").cloned().unwrap_or(json!({})));
            if remember && is_read_only(&tool) {
                if let Some(l) = self.runs.lock().unwrap().get_mut(&run_id) {
                    l.allowed_tools.insert(tool.clone());
                }
            }
            json!({"behavior":"allow","updatedInput": input})
        } else {
            json!({"behavior":"deny","message": message.unwrap_or_else(|| "The user declined this action in AI Job Search Desktop.".into())})
        };
        self.reply(&run_id, &request_id, resp)?;
        self.emit(
            &app,
            &db,
            &run_id,
            "bridge:answered",
            json!({"request_id": request_id, "tool": tool, "allow": allow}),
        );
        let still_pending = self
            .runs
            .lock()
            .unwrap()
            .get(&run_id)
            .map(|l| !l.pending.is_empty())
            .unwrap_or(false);
        if !still_pending {
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
        self.write_line(
            &run_id,
            &json!({"type":"user","message":{"role":"user","content": text}}),
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

    /// Ends a session cleanly: closes stdin so Claude Code exits.
    pub fn finish(&self, run_id: &str) -> Result<(), String> {
        let mut g = self.runs.lock().unwrap();
        let l = g.get_mut(run_id).ok_or("run is not live")?;
        l.stdin = None;
        l.status = "completed".into();
        Ok(())
    }

    pub fn cancel(&self, app: AppHandle, db: Arc<Db>, run_id: String) -> Result<(), String> {
        let _ = self.write_line(&run_id, &json!({"type":"control_request","request_id":format!("int-{}", uuid::Uuid::new_v4()),"request":{"subtype":"interrupt"}}));
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

    pub fn live_ids(&self) -> Vec<(String, String)> {
        // Terminal statuses can linger in the map until the child process fully exits.
        // Only surface statuses that still need UI attention as "live".
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
                    .map(|(k, v)| json!({"request_id": k, "request": v}))
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

pub fn is_read_only(tool: &str) -> bool {
    matches!(
        tool,
        "Read" | "Grep" | "Glob" | "WebSearch" | "WebFetch" | "LS" | "NotebookRead" | "TodoWrite"
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn kinds() {
        assert_eq!(
            kind_of(&json!({"type":"system","subtype":"init"})),
            "system:init"
        );
        assert_eq!(
            kind_of(&json!({"type":"control_request","request":{"subtype":"can_use_tool"}})),
            "control:can_use_tool"
        );
        assert_eq!(
            kind_of(&json!({"type":"result","subtype":"success"})),
            "result:success"
        );
    }
    #[test]
    fn slim_strips_signatures_and_tools() {
        let v = slim(json!({"type":"system","subtype":"init","tools":["a","b"]}));
        assert_eq!(v["tool_count"], 2);
        assert!(v.get("tools").is_none());
        let a = slim(
            json!({"type":"assistant","message":{"content":[{"type":"thinking","thinking":"","signature":"x"},{"type":"text","text":"hi"}]}}),
        );
        assert_eq!(a["message"]["content"].as_array().unwrap().len(), 1);
    }
    #[test]
    fn remember_never_covers_write_tools() {
        assert!(is_read_only("Read"));
        assert!(!is_read_only("Bash"));
        assert!(!is_read_only("Write"));
        assert!(!is_read_only("AskUserQuestion"));
    }
}
