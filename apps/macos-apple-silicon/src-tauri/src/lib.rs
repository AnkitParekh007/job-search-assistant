mod bridge;
mod db;
mod deps;
mod env;
mod providers;
mod workspace;

use db::Db;
use notify::{RecursiveMode, Watcher};
use providers::types::ProviderId;
use providers::Runtime;
use serde_json::{json, Value};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, Manager, State};

struct AppState {
    db: Arc<Db>,
    runtime: Runtime,
    watcher: Mutex<Option<notify::RecommendedWatcher>>,
}

fn default_workspace() -> PathBuf {
    let guess = env::home().join("Desktop/Projects/Automations/Job-Automations/ai-job-search");
    if guess.join("CLAUDE.md").exists() {
        guess
    } else {
        env::home().join("ai-job-search")
    }
}

fn ws(state: &State<AppState>) -> PathBuf {
    state
        .db
        .get_setting("workspace")
        .map(PathBuf::from)
        .unwrap_or_else(default_workspace)
}

fn today() -> String {
    let o = std::process::Command::new("/bin/date")
        .arg("+%Y-%m-%d")
        .output();
    o.map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .unwrap_or_default()
}

fn watch(app: &AppHandle, state: &AppState, dir: PathBuf) {
    let _ = app.asset_protocol_scope().allow_directory(&dir, true);
    let app2 = app.clone();
    let last = Arc::new(Mutex::new(
        std::time::Instant::now() - std::time::Duration::from_secs(5),
    ));
    let w = notify::recommended_watcher(move |res: notify::Result<notify::Event>| {
        if let Ok(ev) = res {
            let relevant = ev.paths.iter().any(|p| {
                let s = p.to_string_lossy();
                !s.contains("/.git/")
                    && !s.ends_with(".aux")
                    && !s.ends_with(".log")
                    && !s.contains(".tmp-")
                    && (s.ends_with(".csv")
                        || s.ends_with(".json")
                        || s.ends_with(".md")
                        || s.ends_with(".pdf")
                        || s.ends_with(".tex"))
            });
            if relevant {
                let mut l = last.lock().unwrap();
                if l.elapsed() > std::time::Duration::from_millis(400) {
                    *l = std::time::Instant::now();
                    let files: Vec<String> = ev
                        .paths
                        .iter()
                        .map(|p| p.to_string_lossy().to_string())
                        .collect();
                    let _ = app2.emit("workspace-changed", json!({"paths": files}));
                }
            }
        }
    });
    if let Ok(mut w) = w {
        let _ = w.watch(&dir, RecursiveMode::Recursive);
        *state.watcher.lock().unwrap() = Some(w);
    }
}

#[tauri::command]
fn get_workspace(state: State<AppState>) -> Value {
    let p = ws(&state);
    json!({"path": p, "valid": p.join("CLAUDE.md").exists(), "upstream_version": deps::upstream_version(&p), "data_dir": env::app_data_dir()})
}

#[tauri::command]
fn set_workspace(app: AppHandle, state: State<AppState>, path: String) -> Result<Value, String> {
    let p = PathBuf::from(&path);
    if !p.join("CLAUDE.md").exists() || !p.join(".claude/commands").is_dir() {
        return Err(
            "That folder is not an AI Job Search checkout (needs CLAUDE.md and .claude/commands)."
                .into(),
        );
    }
    state
        .db
        .set_setting("workspace", &path)
        .map_err(|e| e.to_string())?;
    watch(&app, &state, p);
    Ok(get_workspace(state))
}

#[tauri::command]
fn dependencies(state: State<AppState>) -> Vec<deps::Dep> {
    deps::check(&ws(&state))
}

#[tauri::command]
fn tracker(state: State<AppState>) -> Result<workspace::Tracker, String> {
    workspace::read_tracker(&ws(&state))
}

#[tauri::command]
fn seen_jobs(state: State<AppState>) -> Result<Vec<Value>, String> {
    workspace::read_seen(&ws(&state))
}

#[tauri::command]
fn update_status(
    state: State<AppState>,
    index: usize,
    expected: String,
    status: String,
    note: String,
) -> Result<workspace::TrackerRow, String> {
    workspace::update_status(&ws(&state), index, &expected, &status, &note, &today())
}

#[tauri::command]
fn application_folder(
    state: State<AppState>,
    company: String,
    role: String,
) -> Result<workspace::AppFolder, String> {
    let name = workspace::folder_name(&company, &role);
    if name.is_empty() {
        return Err("empty folder name".into());
    }
    workspace::application_folder(&ws(&state), &name)
}

#[tauri::command]
fn profile(state: State<AppState>) -> Vec<workspace::ProfileFile> {
    workspace::read_profile(&ws(&state))
}

#[tauri::command]
fn documents(state: State<AppState>) -> Value {
    let w = ws(&state);
    json!({"cv": workspace::list_docs(&w, "cv", ".tex"), "cover": workspace::list_docs(&w, "cover_letters", ".tex"),
           "cv_pdf": workspace::list_docs(&w, "cv", ".pdf"), "cover_pdf": workspace::list_docs(&w, "cover_letters", ".pdf"),
           "reports": workspace::list_docs(&w, "reports", ".html")})
}

#[tauri::command]
fn read_text(state: State<AppState>, rel: String) -> Result<String, String> {
    let p = workspace::safe_join(&ws(&state), &rel)?;
    let meta = std::fs::metadata(&p).map_err(|e| e.to_string())?;
    if meta.len() > 2_000_000 {
        return Err("file too large to preview".into());
    }
    std::fs::read_to_string(p).map_err(|e| e.to_string())
}

#[tauri::command]
fn abs_path(state: State<AppState>, rel: String) -> Result<String, String> {
    Ok(workspace::safe_join(&ws(&state), &rel)?
        .to_string_lossy()
        .to_string())
}

#[tauri::command]
fn file_exists(state: State<AppState>, rel: String) -> Result<bool, String> {
    Ok(workspace::safe_join(&ws(&state), &rel)?.is_file())
}

#[tauri::command]
fn compile_doc(state: State<AppState>, rel: String) -> Result<Value, String> {
    let w = ws(&state);
    let (ok, log) = deps::compile(&w, &rel)?;
    let pdf_rel = rel.trim_end_matches(".tex").to_string() + ".pdf";
    let pages = deps::page_count(&workspace::safe_join(&w, &pdf_rel)?);
    Ok(json!({"ok": ok, "log": log, "pdf": pdf_rel, "pages": pages}))
}

#[tauri::command]
fn verify_pdf(state: State<AppState>, rel: String) -> Result<Value, String> {
    let w = ws(&state);
    workspace::safe_join(&w, &rel)?;
    let (code, out, err) = deps::run_tool(&w, "tools/verify_pdf.py", &[rel])?;
    Ok(json!({"code": code, "stdout": out, "stderr": err}))
}

#[tauri::command]
fn posting_guard(state: State<AppState>, text: String) -> Result<Value, String> {
    let w = ws(&state);
    let tmp = env::app_data_dir().join(format!("guard-{}.txt", uuid::Uuid::new_v4()));
    std::fs::write(&tmp, text).map_err(|e| e.to_string())?;
    let r = deps::run_tool(
        &w,
        "tools/posting_guard.py",
        &[
            "--text".into(),
            "--in".into(),
            tmp.to_string_lossy().to_string(),
            "--json".into(),
        ],
    );
    let _ = std::fs::remove_file(&tmp);
    let (code, out, err) = r?;
    Ok(json!({"code": code, "stdout": out, "stderr": err}))
}

#[tauri::command]
fn start_run(
    app: AppHandle,
    state: State<AppState>,
    workflow: String,
    prompt: String,
    model: Option<String>,
    resume: Option<String>,
    provider: Option<String>,
) -> Result<db::RunSummary, String> {
    // Never silently switch providers when resuming a session.
    let provider = if let Some(r) = resume.as_ref() {
        // Look up provider from the most recent run with this session id.
        let runs = state.db.list_runs(200).unwrap_or_default();
        let from_session = runs
            .iter()
            .find(|x| x.session_id == *r)
            .and_then(|x| x.provider.as_deref())
            .and_then(ProviderId::parse);
        from_session
            .or_else(|| provider.as_deref().and_then(ProviderId::parse))
            .unwrap_or_else(|| {
                providers::registry::resolve_default(
                    state.db.get_setting("ai_provider").as_deref(),
                )
            })
    } else {
        provider
            .as_deref()
            .and_then(ProviderId::parse)
            .unwrap_or_else(|| {
                providers::registry::resolve_default(
                    state.db.get_setting("ai_provider").as_deref(),
                )
            })
    };

    let model = model.or_else(|| {
        match provider {
            ProviderId::Claude => state.db.get_setting("model"),
            ProviderId::Codex => state.db.get_setting("codex_model"),
            _ => None,
        }
        .filter(|s| !s.is_empty())
    });

    state.runtime.start(
        app,
        state.db.clone(),
        providers::start_opts(ws(&state), workflow, prompt, model, resume, provider),
    )
}

#[tauri::command]
fn respond_permission(
    app: AppHandle,
    state: State<AppState>,
    run_id: String,
    request_id: String,
    allow: bool,
    updated_input: Option<Value>,
    message: Option<String>,
    remember: Option<bool>,
) -> Result<(), String> {
    state.runtime.respond(
        app,
        state.db.clone(),
        run_id,
        request_id,
        allow,
        updated_input,
        message,
        remember.unwrap_or(false),
    )
}

#[tauri::command]
fn send_message(
    app: AppHandle,
    state: State<AppState>,
    run_id: String,
    text: String,
) -> Result<(), String> {
    state.runtime.send(app, state.db.clone(), run_id, text)
}

#[tauri::command]
fn finish_run(state: State<AppState>, run_id: String) -> Result<(), String> {
    state.runtime.finish(&run_id)
}

#[tauri::command]
fn cancel_run(app: AppHandle, state: State<AppState>, run_id: String) -> Result<(), String> {
    state.runtime.cancel(app, state.db.clone(), run_id)
}

#[tauri::command]
fn list_runs(state: State<AppState>) -> Result<Value, String> {
    let runs = state.db.list_runs(200).map_err(|e| e.to_string())?;
    let live: std::collections::HashMap<String, String> =
        state.runtime.live_ids().into_iter().collect();
    Ok(json!({"runs": runs, "live": live}))
}

#[tauri::command]
fn run_events(state: State<AppState>, run_id: String) -> Result<Value, String> {
    let ev = state.db.run_events(&run_id).map_err(|e| e.to_string())?;
    let items: Vec<Value> = ev.into_iter().map(|(seq, ts, kind, payload)| json!({"run_id": run_id, "seq": seq, "ts": ts, "kind": kind, "data": serde_json::from_str::<Value>(&payload).unwrap_or(Value::Null)})).collect();
    Ok(json!({"events": items, "pending": state.runtime.pending(&run_id)}))
}

#[tauri::command]
fn list_providers() -> Vec<providers::types::ProviderStatus> {
    providers::registry::list_providers()
}

#[tauri::command]
fn provider_account(provider: String) -> Result<Value, String> {
    match ProviderId::parse(&provider) {
        Some(ProviderId::Codex) => {
            let result = providers::codex::oneshot_rpc(
                "account/read",
                json!({"refreshToken": false}),
                15_000,
            )?;
            Ok(result)
        }
        Some(ProviderId::Claude) => {
            let claude = env::which("claude").ok_or("Claude Code CLI not found")?;
            let out = std::process::Command::new(claude)
                .args(["auth", "status"])
                .env("PATH", env::child_path())
                .output()
                .map_err(|e| e.to_string())?;
            let v: Value = serde_json::from_slice(&out.stdout).unwrap_or(json!({
                "raw": String::from_utf8_lossy(&out.stdout),
                "stderr": String::from_utf8_lossy(&out.stderr),
            }));
            Ok(v)
        }
        _ => Err("Provider does not support account status yet".into()),
    }
}

#[tauri::command]
fn provider_login(provider: String, mode: Option<String>) -> Result<Value, String> {
    match ProviderId::parse(&provider) {
        Some(ProviderId::Codex) => {
            let login_type = mode.unwrap_or_else(|| "chatgpt".into());
            let params = if login_type == "chatgpt" {
                json!({
                    "type": "chatgpt",
                    "useHostedLoginSuccessPage": true,
                    "appBrand": "chatgpt"
                })
            } else {
                json!({"type": login_type})
            };
            providers::codex::oneshot_rpc("account/login/start", params, 120_000)
        }
        Some(ProviderId::Claude) => Err(
            "Sign in to Claude Code from Terminal: run `claude` and complete the login flow.".into(),
        ),
        _ => Err("Login is not available for this provider yet".into()),
    }
}

#[tauri::command]
fn provider_models(provider: String) -> Result<Value, String> {
    match ProviderId::parse(&provider) {
        Some(ProviderId::Codex) => {
            providers::codex::oneshot_rpc("model/list", json!({"limit": 50, "includeHidden": false}), 20_000)
        }
        Some(ProviderId::Claude) => Ok(json!({
            "data": [
                {"id": "opus", "name": "Opus"},
                {"id": "sonnet", "name": "Sonnet"},
                {"id": "haiku", "name": "Haiku"}
            ]
        })),
        _ => Err("Model discovery is not available for this provider yet".into()),
    }
}

#[tauri::command]
fn get_setting(state: State<AppState>, key: String) -> Option<String> {
    state.db.get_setting(&key)
}

#[tauri::command]
fn set_setting(state: State<AppState>, key: String, value: String) -> Result<(), String> {
    if key == "workspace" {
        return Err("use set_workspace".into());
    }
    state
        .db
        .set_setting(&key, &value)
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            let db = Arc::new(Db::open(&env::app_data_dir().join("app.db"))?);
            let state = AppState {
                db,
                runtime: Runtime::default(),
                watcher: Mutex::new(None),
            };
            let w = state
                .db
                .get_setting("workspace")
                .map(PathBuf::from)
                .unwrap_or_else(default_workspace);
            watch(app.handle(), &state, w);
            app.manage(state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_workspace,
            set_workspace,
            dependencies,
            tracker,
            seen_jobs,
            update_status,
            application_folder,
            profile,
            documents,
            read_text,
            abs_path,
            file_exists,
            compile_doc,
            verify_pdf,
            posting_guard,
            start_run,
            respond_permission,
            send_message,
            finish_run,
            cancel_run,
            list_runs,
            run_events,
            get_setting,
            set_setting,
            list_providers,
            provider_account,
            provider_login,
            provider_models
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, ev| {
            if let tauri::RunEvent::Exit = ev {
                app.state::<AppState>().runtime.shutdown();
            }
        });
}
