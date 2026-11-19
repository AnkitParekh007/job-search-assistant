//! Process environment for child processes.
//!
//! A macOS app launched from Finder inherits a minimal PATH, so every child
//! (claude, python, lualatex) gets an explicit PATH built here. A private shim
//! directory maps `python3`/`python` to an interpreter >= 3.10, because the
//! upstream tools use PEP 604 syntax and macOS's /usr/bin/python3 is 3.9.

use std::path::{Path, PathBuf};
use std::process::Command;

pub fn home() -> PathBuf {
    dirs::home_dir().unwrap_or_else(|| PathBuf::from("/"))
}

pub fn app_data_dir() -> PathBuf {
    let d = dirs::data_dir()
        .unwrap_or_else(|| home().join("Library/Application Support"))
        .join("dev.local.aijobsearch");
    let _ = std::fs::create_dir_all(&d);
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = std::fs::set_permissions(&d, std::fs::Permissions::from_mode(0o700));
    }
    d
}

fn candidate_dirs() -> Vec<PathBuf> {
    let h = home();
    let mut v = vec![
        PathBuf::from("/opt/homebrew/bin"),
        PathBuf::from("/usr/local/bin"),
        h.join(".local/bin"),
        h.join(".claude/local"),
        h.join(".bun/bin"),
        h.join(".cargo/bin"),
        h.join(".npm-global/bin"),
        h.join("n/bin"),
        h.join(".nvm/current/bin"),
        PathBuf::from("/Library/TeX/texbin"),
    ];
    // TeX Live / BasicTeX installs without the /Library/TeX symlink.
    if let Ok(rd) = std::fs::read_dir("/usr/local/texlive") {
        let mut years: Vec<PathBuf> = rd.flatten().map(|e| e.path()).collect();
        years.sort();
        for y in years.into_iter().rev() {
            for arch in ["universal-darwin", "x86_64-darwin"] {
                let b = y.join("bin").join(arch);
                if b.is_dir() {
                    v.push(b);
                    break;
                }
            }
        }
    }
    v.push(h.join("Library/TinyTeX/bin/universal-darwin"));
    v.push(h.join("Library/TinyTeX/bin/x86_64-darwin"));
    v.extend(["/usr/bin", "/bin", "/usr/sbin", "/sbin"].iter().map(PathBuf::from));
    v
}

pub fn which(name: &str) -> Option<PathBuf> {
    for d in candidate_dirs() {
        let p = d.join(name);
        if p.is_file() {
            return Some(p);
        }
    }
    None
}

/// Interpreter >= 3.10, preferring the newest.
pub fn python() -> Option<(PathBuf, String)> {
    for name in ["python3.14", "python3.13", "python3.12", "python3.11", "python3.10", "python3"] {
        if let Some(p) = which(name) {
            if let Ok(out) = Command::new(&p).arg("--version").output() {
                let s = String::from_utf8_lossy(&out.stdout).to_string()
                    + &String::from_utf8_lossy(&out.stderr);
                let ver = s.trim().trim_start_matches("Python ").to_string();
                let mut it = ver.split('.');
                let maj: u32 = it.next().and_then(|x| x.parse().ok()).unwrap_or(0);
                let min: u32 = it.next().and_then(|x| x.parse().ok()).unwrap_or(0);
                if maj == 3 && min >= 10 {
                    return Some((p, ver));
                }
            }
        }
    }
    None
}

fn shim_dir() -> PathBuf {
    let d = app_data_dir().join("shims");
    let _ = std::fs::create_dir_all(&d);
    if let Some((py, _)) = python() {
        for n in ["python3", "python"] {
            let link = d.join(n);
            let _ = std::fs::remove_file(&link);
            #[cfg(unix)]
            let _ = std::os::unix::fs::symlink(&py, &link);
        }
    }
    d
}

pub fn child_path() -> String {
    let mut parts = vec![shim_dir()];
    parts.extend(candidate_dirs().into_iter().filter(|d| d.is_dir()));
    parts
        .iter()
        .map(|p| p.to_string_lossy().to_string())
        .collect::<Vec<_>>()
        .join(":")
}

/// A Command with a clean, explicit environment. Arguments are always passed
/// as argv entries, never through a shell string.
pub fn command(program: &Path, cwd: &Path) -> Command {
    let mut c = Command::new(program);
    c.current_dir(cwd);
    c.env("PATH", child_path());
    c.env("HOME", home());
    c.env_remove("CLAUDECODE");
    c
}
