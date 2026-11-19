//! Dependency health checks and direct calls to deterministic upstream tools.

use crate::env;
use serde::Serialize;
use serde_json::Value;
use std::path::Path;

#[derive(Serialize)]
pub struct Dep {
    pub id: String,
    pub name: String,
    pub ok: bool,
    pub required: bool,
    pub detail: String,
    pub fix: String,
}

fn version_of(bin: &str, args: &[&str]) -> Option<(String, String)> {
    let p = env::which(bin)?;
    let out = std::process::Command::new(&p)
        .args(args)
        .env("PATH", env::child_path())
        .output()
        .ok()?;
    let s =
        String::from_utf8_lossy(&out.stdout).to_string() + &String::from_utf8_lossy(&out.stderr);
    Some((
        p.to_string_lossy().to_string(),
        s.lines().next().unwrap_or("").trim().to_string(),
    ))
}

pub fn check(ws: &Path) -> Vec<Dep> {
    let mut v = vec![];
    let claude = version_of("claude", &["--version"]);
    v.push(Dep { id: "claude".into(), name: "Claude Code CLI".into(), ok: claude.is_some(), required: false,
        detail: claude.as_ref().map(|(p, s)| format!("{} ({})", s, p)).unwrap_or("not found".into()),
        fix: "Install Claude Code (brew install --cask claude-code) and run `claude` once to sign in. Runs use your Claude subscription or API credits; they are not free.".into() });
    let auth = env::which("claude")
        .and_then(|p| {
            std::process::Command::new(p)
                .args(["auth", "status"])
                .env("PATH", env::child_path())
                .output()
                .ok()
        })
        .and_then(|o| serde_json::from_slice::<Value>(&o.stdout).ok());
    let logged = auth
        .as_ref()
        .and_then(|a| a.get("loggedIn"))
        .and_then(|b| b.as_bool())
        .unwrap_or(false);
    v.push(Dep {
        id: "claude_auth".into(),
        name: "Claude sign-in".into(),
        ok: logged,
        required: false,
        detail: auth
            .map(|a| {
                format!(
                    "{} via {}",
                    if logged { "signed in" } else { "signed out" },
                    a.get("authMethod").and_then(|s| s.as_str()).unwrap_or("?")
                )
            })
            .unwrap_or("unknown".into()),
        fix: "Run `claude` in Terminal once and complete sign-in.".into(),
    });
    let codex = version_of("codex", &["--version"]);
    let codex_cfg = env::home().join(".codex").is_dir();
    v.push(Dep {
        id: "codex".into(),
        name: "OpenAI Codex CLI".into(),
        ok: codex.is_some(),
        required: false,
        detail: codex
            .as_ref()
            .map(|(p, s)| format!("{} ({})", s, p))
            .unwrap_or("not found".into()),
        fix: "Install the Codex CLI (see https://learn.chatgpt.com/docs/codex), then connect ChatGPT from Settings → AI Providers.".into(),
    });
    v.push(Dep {
        id: "codex_auth".into(),
        name: "Codex config".into(),
        ok: codex.is_some() && codex_cfg,
        required: false,
        detail: if codex_cfg {
            "Codex home present — verify sign-in from Settings → AI Providers".into()
        } else {
            "not signed in yet".into()
        },
        fix: "Use Connect in Settings to start ChatGPT sign-in for Codex.".into(),
    });
    let any_ai = claude.is_some() || codex.is_some();
    v.push(Dep {
        id: "ai_provider".into(),
        name: "At least one AI provider".into(),
        ok: any_ai,
        required: true,
        detail: if any_ai {
            "Claude Code and/or Codex CLI detected".into()
        } else {
            "neither Claude Code nor Codex CLI found".into()
        },
        fix:
            "Install Claude Code and/or the Codex CLI, then choose a default provider in Settings."
                .into(),
    });
    let py = env::python();
    v.push(Dep {
        id: "python".into(),
        name: "Python >= 3.10".into(),
        ok: py.is_some(),
        required: true,
        detail: py
            .as_ref()
            .map(|(p, s)| format!("{} ({})", s, p.display()))
            .unwrap_or("only Python < 3.10 found (macOS ships 3.9)".into()),
        fix:
            "brew install python@3.12. The app maps python3 to it for upstream tools automatically."
                .into(),
    });
    for (id, bin, name, why) in [
        ("lualatex", "lualatex", "LuaLaTeX (CV)", "CV PDFs"),
        (
            "xelatex",
            "xelatex",
            "XeLaTeX (cover letter)",
            "cover letter PDFs",
        ),
    ] {
        let r = version_of(bin, &["--version"]);
        v.push(Dep { id: id.into(), name: name.into(), ok: r.is_some(), required: true,
            detail: r.map(|(p, s)| format!("{} ({})", s, p)).unwrap_or("not found".into()),
            fix: format!("Needed for {}. brew install --cask basictex, then tlmgr install moderncv fontawesome5 fontawesome6 academicons import luatexbase pgf titlesec textpos xltxtra xunicode cite realscripts needspace (see upstream SETUP.md).", why) });
    }
    let pdft = version_of("pdftotext", &["-v"]);
    v.push(Dep {
        id: "pdftotext".into(),
        name: "PDF text extraction".into(),
        ok: pdft.is_some(),
        required: false,
        detail: pdft
            .map(|(p, s)| format!("{} ({})", s, p))
            .unwrap_or("not found (pypdf may still work)".into()),
        fix: "brew install poppler, or pip install pypdf".into(),
    });
    let bun = version_of("bun", &["--version"]);
    v.push(Dep {
        id: "bun".into(),
        name: "Bun (portal CLIs)".into(),
        ok: bun.is_some(),
        required: false,
        detail: bun
            .map(|(p, s)| format!("{} ({})", s, p))
            .unwrap_or("not installed - /scrape falls back to WebSearch".into()),
        fix: "Only needed for community portal CLIs: brew install oven-sh/bun/bun".into(),
    });
    let portals = ws.join(".agents/skills");
    let n = std::fs::read_dir(&portals)
        .map(|r| r.flatten().count())
        .unwrap_or(0);
    v.push(Dep { id: "portals".into(), name: "Installed portals".into(), ok: n > 0, required: false,
        detail: format!("{} installed", n), fix: "Copy portals from github.com/ai-job-search-dev/community-portals via the Portals screen, or create one with /add-portal.".into() });
    v
}

pub fn upstream_version(ws: &Path) -> String {
    let out = std::process::Command::new("/usr/bin/git")
        .args(["describe", "--tags", "--always"])
        .current_dir(ws)
        .output();
    out.map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .unwrap_or_default()
}

/// Runs an upstream deterministic tool with argv (never a shell string).
pub fn run_tool(ws: &Path, script: &str, args: &[String]) -> Result<(i32, String, String), String> {
    const ALLOWED: [&str; 5] = [
        "tools/posting_guard.py",
        "tools/verify_pdf.py",
        "tools/verify_layout.py",
        "tools/scrape_state.py",
        "tools/check_upstream_updates.py",
    ];
    if !ALLOWED.contains(&script) {
        return Err(format!("{} is not on the app's allow-list", script));
    }
    let (py, _) = env::python().ok_or("Python >= 3.10 not found")?;
    let out = env::command(&py, ws)
        .arg("-I")
        .arg(script)
        .args(args)
        .output()
        .map_err(|e| e.to_string())?;
    Ok((
        out.status.code().unwrap_or(-1),
        String::from_utf8_lossy(&out.stdout).to_string(),
        String::from_utf8_lossy(&out.stderr).to_string(),
    ))
}

/// Compile a CV (lualatex) or cover letter (xelatex) in its own directory.
pub fn compile(ws: &Path, rel_tex: &str) -> Result<(bool, String), String> {
    let tex = crate::workspace::safe_join(ws, rel_tex)?;
    if tex.extension().and_then(|e| e.to_str()) != Some("tex") {
        return Err("only .tex sources can be compiled here".into());
    }
    let engine = if rel_tex.starts_with("cover_letters/") {
        "xelatex"
    } else {
        "lualatex"
    };
    let bin = env::which(engine).ok_or(format!(
        "{} not found - see Settings > Dependencies",
        engine
    ))?;
    let dir = tex.parent().ok_or("bad path")?;
    let name = tex.file_name().unwrap().to_string_lossy().to_string();
    let out = env::command(&bin, dir)
        .args(["-interaction=nonstopmode", "-halt-on-error", &name])
        .output()
        .map_err(|e| e.to_string())?;
    let log = String::from_utf8_lossy(&out.stdout).to_string();
    let tail: String = log
        .lines()
        .rev()
        .take(25)
        .collect::<Vec<_>>()
        .into_iter()
        .rev()
        .collect::<Vec<_>>()
        .join("\n");
    Ok((out.status.success(), tail))
}

/// Page count via pdfinfo when present, else a byte scan fallback.
pub fn page_count(pdf: &Path) -> Option<u32> {
    if let Some(p) = env::which("pdfinfo") {
        if let Ok(o) = std::process::Command::new(p).arg(pdf).output() {
            for l in String::from_utf8_lossy(&o.stdout).lines() {
                if let Some(n) = l.strip_prefix("Pages:") {
                    return n.trim().parse().ok();
                }
            }
        }
    }
    None
}
