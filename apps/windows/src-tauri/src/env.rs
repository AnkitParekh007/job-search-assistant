//! Process environment for child processes.
//!
//! Desktop shells launched from a GUI often inherit a minimal PATH, so every child
//! (claude, python, lualatex/xelatex) gets an explicit PATH built here. A private shim
//! maps `python3`/`python` to an interpreter >= 3.10 when possible.

use std::path::{Path, PathBuf};
use std::process::Command;

pub fn home() -> PathBuf {
    dirs::home_dir().unwrap_or_else(|| {
        #[cfg(windows)]
        {
            PathBuf::from("C:\\")
        }
        #[cfg(not(windows))]
        {
            PathBuf::from("/")
        }
    })
}

pub fn app_data_dir() -> PathBuf {
    let d = dirs::data_dir()
        .unwrap_or_else(|| {
            #[cfg(windows)]
            {
                home().join("AppData").join("Roaming")
            }
            #[cfg(not(windows))]
            {
                home().join("Library/Application Support")
            }
        })
        .join("dev.local.aijobsearch.windows");
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
    let mut v: Vec<PathBuf> = Vec::new();

    #[cfg(windows)]
    {
        let local = h.join("AppData").join("Local");
        let roaming = h.join("AppData").join("Roaming");
        v.extend([
            local.join("Programs").join("claude-code"),
            local.join("Programs").join("Claude Code"),
            roaming.join("npm"),
            h.join(".local").join("bin"),
            h.join(".claude").join("local"),
            h.join(".bun").join("bin"),
            h.join(".cargo").join("bin"),
            PathBuf::from(r"C:\Program Files\Git\cmd"),
            PathBuf::from(r"C:\Program Files\Git\bin"),
            PathBuf::from(r"C:\Program Files\Python312"),
            PathBuf::from(r"C:\Program Files\Python311"),
            PathBuf::from(r"C:\Program Files\Python310"),
            PathBuf::from(r"C:\Python312"),
            PathBuf::from(r"C:\Python311"),
            PathBuf::from(r"C:\Python310"),
            PathBuf::from(r"C:\Windows\System32"),
            PathBuf::from(r"C:\Windows"),
        ]);
        // MiKTeX / TeX Live common Windows locations
        v.push(local.join("Programs").join("MiKTeX").join("miktex").join("bin").join("x64"));
        v.push(PathBuf::from(r"C:\texlive\2025\bin\windows"));
        v.push(PathBuf::from(r"C:\texlive\2024\bin\windows"));
        if let Ok(pf) = std::env::var("ProgramFiles") {
            v.push(PathBuf::from(pf.clone()).join("MiKTeX").join("miktex").join("bin").join("x64"));
            v.push(PathBuf::from(pf).join("Git").join("cmd"));
        }
        if let Ok(path) = std::env::var("PATH") {
            for part in std::env::split_paths(&path) {
                if part.as_os_str().len() > 0 {
                    v.push(part);
                }
            }
        }
    }

    #[cfg(not(windows))]
    {
        v.extend([
            PathBuf::from("/opt/homebrew/bin"),
            PathBuf::from("/usr/local/bin"),
            h.join(".local/bin"),
            h.join(".claude/local"),
            h.join(".bun/bin"),
            h.join(".cargo/bin"),
            PathBuf::from("/Library/TeX/texbin"),
        ]);
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
        v.extend(["/usr/bin", "/bin", "/usr/sbin", "/sbin"].iter().map(PathBuf::from));
    }

    v
}

pub fn which(name: &str) -> Option<PathBuf> {
    let names = {
        #[cfg(windows)]
        {
            vec![
                name.to_string(),
                format!("{name}.exe"),
                format!("{name}.cmd"),
                format!("{name}.bat"),
            ]
        }
        #[cfg(not(windows))]
        {
            vec![name.to_string()]
        }
    };
    for d in candidate_dirs() {
        for n in &names {
            let p = d.join(n);
            if p.is_file() {
                return Some(p);
            }
        }
    }
    None
}

/// Interpreter >= 3.10, preferring the newest.
pub fn python() -> Option<(PathBuf, String)> {
    let candidates = [
        "python3.14",
        "python3.13",
        "python3.12",
        "python3.11",
        "python3.10",
        "python3",
        "python",
    ];
    for name in candidates {
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
        #[cfg(unix)]
        {
            for n in ["python3", "python"] {
                let link = d.join(n);
                let _ = std::fs::remove_file(&link);
                let _ = std::os::unix::fs::symlink(&py, &link);
            }
        }
        #[cfg(windows)]
        {
            // Write tiny cmd shims so `python`/`python3` resolve to the chosen interpreter.
            for n in ["python3.cmd", "python.cmd"] {
                let shim = d.join(n);
                let body = format!("@echo off\r\n\"{}\" %*\r\n", py.display());
                let _ = std::fs::write(&shim, body);
            }
        }
    }
    d
}

pub fn child_path() -> String {
    let mut parts = vec![shim_dir()];
    parts.extend(candidate_dirs().into_iter().filter(|d| d.is_dir()));
    std::env::join_paths(parts.iter())
        .map(|os| os.to_string_lossy().into_owned())
        .unwrap_or_default()
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
