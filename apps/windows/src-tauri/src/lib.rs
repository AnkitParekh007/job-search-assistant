mod bridge;
mod candidate;
mod db;
mod deps;
mod env;
mod orchestration;
mod providers;
mod security;
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
    // Never silently bind to a guessed checkout (e.g. a nearby ai-job-search clone).
    // Workspace must be chosen explicitly via set_workspace / onboarding.
    PathBuf::new()
}

fn configured_workspace(state: &State<AppState>) -> Option<PathBuf> {
    state
        .db
        .get_setting("workspace")
        .filter(|s| !s.trim().is_empty())
        .map(PathBuf::from)
}

fn ws(state: &State<AppState>) -> PathBuf {
    configured_workspace(state).unwrap_or_else(default_workspace)
}

fn today() -> String {
    let o = std::process::Command::new("powershell")
        .args(["-NoProfile", "-Command", "Get-Date -Format yyyy-MM-dd"])
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
    let configured = configured_workspace(&state);
    let p = configured.clone().unwrap_or_else(default_workspace);
    let valid = configured
        .as_ref()
        .map(|path| path.is_dir() && path.join("CLAUDE.md").exists())
        .unwrap_or(false);
    json!({
        "path": p,
        "valid": valid,
        "configured": configured.is_some(),
        "upstream_version": if valid { deps::upstream_version(&p) } else { String::new() },
        "data_dir": env::app_data_dir(),
        "created": Value::Array(vec![]),
    })
}

/// Accept only an absolute existing directory (or absolute path the user explicitly creates).
/// Relative names are rejected so we never scaffold under the process cwd and orphan the prior workspace.
fn resolve_workspace_path(path: &str) -> Result<PathBuf, String> {
    let trimmed = path.trim();
    if trimmed.is_empty() {
        return Err("Choose a folder path first.".into());
    }
    let p = PathBuf::from(trimmed);
    if !p.is_absolute() {
        return Err(
            "Use an absolute folder path (or Browse). Relative names like \"INVALID\" are rejected so your current workspace stays connected."
                .into(),
        );
    }
    if p.exists() && !p.is_dir() {
        return Err(format!("{} exists but is not a folder", p.display()));
    }
    // Canonicalize when the path exists; for a new folder keep the absolute path as given.
    if p.exists() {
        p.canonicalize()
            .map_err(|e| format!("could not resolve {}: {}", p.display(), e))
    } else {
        Ok(p)
    }
}

#[tauri::command]
fn set_workspace(app: AppHandle, state: State<AppState>, path: String) -> Result<Value, String> {
    let prior = state.db.get_setting("workspace");
    let p = match resolve_workspace_path(&path) {
        Ok(p) => p,
        Err(e) => {
            // Keep prior workspace setting intact on validation failure.
            return Err(e);
        }
    };
    let created = match workspace::ensure_workspace(&p) {
        Ok(c) => c,
        Err(e) => {
            let _ = prior; // prior setting never overwritten below
            return Err(e);
        }
    };
    let stored = p.to_string_lossy().to_string();
    state
        .db
        .set_setting("workspace", &stored)
        .map_err(|e| e.to_string())?;
    watch(&app, &state, p.clone());
    Ok(json!({
        "path": p,
        "valid": p.join("CLAUDE.md").exists(),
        "upstream_version": deps::upstream_version(&p),
        "data_dir": env::app_data_dir(),
        "created": created,
    }))
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
fn candidate_profile(state: State<AppState>) -> Result<Value, String> {
    candidate::read_candidate_profile(&ws(&state))
}

#[tauri::command]
fn save_candidate_profile(state: State<AppState>, profile: Value) -> Result<Value, String> {
    candidate::write_candidate_profile(&ws(&state), &profile)
}

#[tauri::command]
fn add_application(
    state: State<AppState>,
    fields: std::collections::BTreeMap<String, String>,
) -> Result<workspace::TrackerRow, String> {
    workspace::add_tracker_row(&ws(&state), fields, &today())
}

#[tauri::command]
fn upsert_job(state: State<AppState>, job: Value) -> Result<Value, String> {
    let mut job = job;
    if let Some(obj) = job.as_object_mut() {
        let day = today();
        if !obj.contains_key("last_verified") && !day.is_empty() {
            obj.insert("last_verified".into(), Value::String(day.clone()));
        }
        if !obj.contains_key("first_seen") && !day.is_empty() {
            obj.insert("first_seen".into(), Value::String(day));
        }
    }
    workspace::upsert_seen_job(&ws(&state), job)
}

#[tauri::command]
fn migrate_workspace(state: State<AppState>) -> Result<Value, String> {
    workspace::migrate_legacy_to_canonical(&ws(&state))
}

#[tauri::command]
fn restore_workspace_backup(state: State<AppState>, backup_folder_name: String) -> Result<Value, String> {
    workspace::restore_workspace_backup(&ws(&state), &backup_folder_name)
}

/// Extract plain text from a local resume file (PDF via pdftotext, DOCX via unzip, or text).
/// Absolute paths only. Used by Profile offline parse (ATS-01) — no AI, no network.
#[tauri::command]
fn extract_resume_text(state: State<AppState>, path: String) -> Result<Value, String> {
    let p = PathBuf::from(path.trim());
    if !p.is_absolute() {
        return Err("Resume path must be absolute.".into());
    }
    if !p.is_file() {
        return Err(format!("File not found: {}", p.display()));
    }
    let ext = p
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    let text = match ext.as_str() {
        "txt" | "md" | "markdown" => std::fs::read_to_string(&p).map_err(|e| e.to_string())?,
        "pdf" => {
            let bin = env::which("pdftotext").ok_or(
                "pdftotext not found. Install poppler (brew install poppler), or paste resume text instead.",
            )?;
            let out = std::process::Command::new(bin)
                .args(["-layout", "-enc", "UTF-8"])
                .arg(&p)
                .arg("-")
                .env("PATH", env::child_path())
                .output()
                .map_err(|e| e.to_string())?;
            if !out.status.success() {
                return Err(format!(
                    "pdftotext failed: {}",
                    String::from_utf8_lossy(&out.stderr).trim()
                ));
            }
            String::from_utf8_lossy(&out.stdout).to_string()
        }
        "docx" => {
            let out = std::process::Command::new("unzip")
                .args(["-p"])
                .arg(&p)
                .arg("word/document.xml")
                .output()
                .map_err(|e| format!("unzip failed (needed for DOCX): {e}"))?;
            if !out.status.success() {
                return Err("Could not read DOCX (unzip word/document.xml failed).".into());
            }
            let xml = String::from_utf8_lossy(&out.stdout);
            let mut plain = String::new();
            let mut in_tag = false;
            for c in xml.chars() {
                match c {
                    '<' => in_tag = true,
                    '>' => {
                        in_tag = false;
                        plain.push(' ');
                    }
                    _ if !in_tag => plain.push(c),
                    _ => {}
                }
            }
            plain.split_whitespace().collect::<Vec<_>>().join(" ")
        }
        _ => {
            return Err(
                "Supported resume types: .pdf, .docx, .txt, .md. Or paste plain text in Profile."
                    .into(),
            )
        }
    };
    let w = ws(&state);
    let art = w.join("candidate/resume_artifacts");
    let _ = std::fs::create_dir_all(&art);
    let stamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    let dest = art.join(format!(
        "import-{}{}",
        stamp,
        p.extension()
            .and_then(|e| e.to_str())
            .map(|e| format!(".{e}"))
            .unwrap_or_default()
    ));
    let _ = std::fs::copy(&p, &dest);
    let _ = std::fs::write(art.join("last-extract.txt"), &text);
    Ok(json!({
        "text": text,
        "chars": text.chars().count(),
        "source_path": p.to_string_lossy(),
        "artifact": dest.to_string_lossy(),
    }))
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
    let script = w.join("tools/posting_guard.py");
    if !script.is_file() {
        let _ = workspace::ensure_posting_guard(&w);
    }
    let script = w.join("tools/posting_guard.py");
    if !script.is_file() {
        return Ok(json!({
            "code": 1,
            "stdout": "",
            "stderr": "Integrity checker is not installed in this workspace. Use Settings → Switch to reconnect so starter tools are scaffolded."
        }));
    }
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
    match r {
        Ok((code, out, err)) => Ok(json!({"code": code, "stdout": out, "stderr": err})),
        Err(e) => Ok(json!({
            "code": 1,
            "stdout": "",
            "stderr": format!("Integrity check could not run: {}. Install Python 3.10+ from Settings → Dependencies.", e)
        })),
    }
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
                providers::registry::resolve_default(state.db.get_setting("ai_provider").as_deref())
            })
    } else {
        provider
            .as_deref()
            .and_then(ProviderId::parse)
            .unwrap_or_else(|| {
                providers::registry::resolve_default(state.db.get_setting("ai_provider").as_deref())
            })
    };

    let model = model.or_else(|| {
        match provider {
            ProviderId::Claude => state.db.get_setting("model"),
            ProviderId::Codex => state.db.get_setting("codex_model"),
            ProviderId::OpenaiApi => state.db.get_setting("openai_api_model"),
            ProviderId::Gemini => state.db.get_setting("gemini_model"),
            ProviderId::Ollama => state.db.get_setting("ollama_model"),
        }
        .filter(|s| !s.is_empty())
    });

    let workspace = configured_workspace(&state).ok_or_else(|| {
        "No workspace connected. Choose a folder in Onboarding or Settings before starting a run."
            .to_string()
    })?;
    if !workspace.join("CLAUDE.md").exists() {
        return Err(format!(
            "Workspace at {} is missing CLAUDE.md — reconnect the folder so Jobzuu can scaffold it.",
            workspace.display()
        ));
    }

    state.runtime.start(
        app,
        state.db.clone(),
        providers::start_opts(workspace, workflow, prompt, model, resume, provider),
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
fn list_providers(state: State<AppState>) -> Vec<providers::types::ProviderStatus> {
    let endpoint = state.db.get_setting("ollama_endpoint");
    providers::registry::list_providers(endpoint.as_deref())
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
        Some(ProviderId::OpenaiApi) => Ok(json!({
            "loggedIn": security::credentials::has_secret(security::credentials::CredentialKind::OpenaiApi),
            "authMethod": "api_key_keychain",
            "requiresOpenaiAuth": !security::credentials::has_secret(security::credentials::CredentialKind::OpenaiApi),
        })),
        Some(ProviderId::Gemini) => Ok(json!({
            "loggedIn": security::credentials::has_secret(security::credentials::CredentialKind::GeminiApi)
                || env::which("gemini").is_some(),
            "authMethod": if security::credentials::has_secret(security::credentials::CredentialKind::GeminiApi) {
                "api_key_keychain"
            } else {
                "cli"
            },
            "cliInstalled": env::which("gemini").is_some(),
            "apiKeyConfigured": security::credentials::has_secret(security::credentials::CredentialKind::GeminiApi),
        })),
        Some(ProviderId::Ollama) => {
            let probe = providers::ollama::test_connection(None).unwrap_or_else(|e| {
                json!({
                    "ok": false,
                    "error": e
                })
            });
            Ok(json!({
                "loggedIn": probe.get("ok").and_then(|b| b.as_bool()).unwrap_or(false),
                "authMethod": "local",
                "probe": probe,
            }))
        }
        None => Err("Unknown provider".into()),
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
            "Sign in to Claude Code from Terminal: run `claude` and complete the login flow."
                .into(),
        ),
        Some(ProviderId::Gemini) => Err(
            "Sign in to Gemini CLI from Terminal (`gemini`), or paste a Developer API key via Settings → Configure."
                .into(),
        ),
        Some(ProviderId::OpenaiApi) => Err(
            "OpenAI API uses a Platform API key (BYOK). Use Settings → Configure — not ChatGPT / Codex login."
                .into(),
        ),
        Some(ProviderId::Ollama) => Err(
            "Ollama is local. Start the service with `ollama serve` and pull a model yourself."
                .into(),
        ),
        None => Err("Unknown provider".into()),
    }
}

#[tauri::command]
fn provider_models(state: State<AppState>, provider: String) -> Result<Value, String> {
    match ProviderId::parse(&provider) {
        Some(ProviderId::Codex) => providers::codex::oneshot_rpc(
            "model/list",
            json!({"limit": 50, "includeHidden": false}),
            20_000,
        ),
        Some(ProviderId::Claude) => Ok(json!({
            "data": [
                {"id": "opus", "name": "Opus"},
                {"id": "sonnet", "name": "Sonnet"},
                {"id": "haiku", "name": "Haiku"}
            ]
        })),
        Some(ProviderId::OpenaiApi) => providers::openai_api::list_models(),
        Some(ProviderId::Gemini) => {
            if security::credentials::has_secret(security::credentials::CredentialKind::GeminiApi) {
                providers::gemini::list_models_api()
            } else {
                Ok(json!({
                    "data": [
                        {"id": "gemini-2.0-flash", "name": "gemini-2.0-flash"},
                        {"id": "gemini-2.5-flash", "name": "gemini-2.5-flash"},
                        {"id": "gemini-2.5-pro", "name": "gemini-2.5-pro"}
                    ],
                    "note": "CLI model list unavailable; showing common IDs. Add an API key for live discovery."
                }))
            }
        }
        Some(ProviderId::Ollama) => {
            let endpoint = state.db.get_setting("ollama_endpoint");
            providers::ollama::list_models(endpoint.as_deref())
        }
        None => Err("Unknown provider".into()),
    }
}

#[tauri::command]
fn provider_set_credential(provider: String, secret: String) -> Result<Value, String> {
    let kind = security::credentials::CredentialKind::parse(&provider)
        .ok_or("This provider does not accept an API key here")?;
    security::credentials::store_secret(kind, &secret)?;
    // Do not echo the secret back.
    Ok(json!({"ok": true, "provider": provider, "stored": true}))
}

#[tauri::command]
fn provider_clear_credential(provider: String) -> Result<Value, String> {
    let kind = security::credentials::CredentialKind::parse(&provider)
        .ok_or("This provider does not store an API key here")?;
    security::credentials::clear_secret(kind)?;
    Ok(json!({"ok": true, "provider": provider, "cleared": true}))
}

#[tauri::command]
fn provider_test(state: State<AppState>, provider: String) -> Result<Value, String> {
    match ProviderId::parse(&provider) {
        Some(ProviderId::OpenaiApi) => providers::openai_api::test_connection(),
        Some(ProviderId::Gemini) => {
            if security::credentials::has_secret(security::credentials::CredentialKind::GeminiApi) {
                providers::gemini::test_connection_api()
            } else {
                providers::gemini::test_connection_cli()
            }
        }
        Some(ProviderId::Ollama) => {
            let endpoint = state.db.get_setting("ollama_endpoint");
            providers::ollama::test_connection(endpoint.as_deref())
        }
        Some(ProviderId::Codex) => {
            let acct = providers::codex::oneshot_rpc(
                "account/read",
                json!({"refreshToken": false}),
                15_000,
            )?;
            Ok(json!({"ok": true, "mode": "codex", "account": acct}))
        }
        Some(ProviderId::Claude) => {
            let claude = env::which("claude").ok_or("Claude Code CLI not found")?;
            let out = std::process::Command::new(claude)
                .arg("--version")
                .env("PATH", env::child_path())
                .output()
                .map_err(|e| e.to_string())?;
            Ok(json!({
                "ok": out.status.success(),
                "version": String::from_utf8_lossy(&out.stdout).trim(),
            }))
        }
        None => Err("Unknown provider".into()),
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
            if let Some(w) = state
                .db
                .get_setting("workspace")
                .filter(|s| !s.trim().is_empty())
                .map(PathBuf::from)
            {
                watch(app.handle(), &state, w);
            }
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
            candidate_profile,
            save_candidate_profile,
            add_application,
            upsert_job,
            migrate_workspace,
            restore_workspace_backup,
            extract_resume_text,
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
            provider_models,
            provider_set_credential,
            provider_clear_credential,
            provider_test
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, ev| {
            if let tauri::RunEvent::Exit = ev {
                app.state::<AppState>().runtime.shutdown();
            }
        });
}
