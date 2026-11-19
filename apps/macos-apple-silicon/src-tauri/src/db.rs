//! App-owned state only (run history, settings). Upstream files are never
//! mirrored here as a second source of truth. All queries are parameterised.

use rusqlite::{params, Connection, OptionalExtension};
use serde::Serialize;
use std::path::Path;
use std::sync::Mutex;

pub struct Db(pub Mutex<Connection>);

#[derive(Serialize, Clone, Debug)]
pub struct RunSummary {
    pub id: String,
    pub workflow: String,
    pub prompt: String,
    pub session_id: String,
    pub status: String,
    pub started_at: i64,
    pub finished_at: Option<i64>,
    pub cost_usd: Option<f64>,
    pub summary: Option<String>,
    pub error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub provider: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
}

impl Db {
    pub fn open(path: &Path) -> rusqlite::Result<Db> {
        let c = Connection::open(path)?;
        c.execute_batch(
            "PRAGMA journal_mode=WAL;
             CREATE TABLE IF NOT EXISTS runs(
               id TEXT PRIMARY KEY, workflow TEXT NOT NULL, prompt TEXT NOT NULL,
               session_id TEXT NOT NULL, status TEXT NOT NULL, started_at INTEGER NOT NULL,
               finished_at INTEGER, cost_usd REAL, summary TEXT, error TEXT, workspace TEXT);
             CREATE TABLE IF NOT EXISTS run_events(
               run_id TEXT NOT NULL, seq INTEGER NOT NULL, ts INTEGER NOT NULL, kind TEXT NOT NULL,
               payload TEXT NOT NULL, PRIMARY KEY(run_id, seq));
             CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT NOT NULL);",
        )?;
        // Additive migrations for multi-provider metadata (safe on existing DBs).
        let _ = c.execute("ALTER TABLE runs ADD COLUMN provider TEXT", []);
        let _ = c.execute("ALTER TABLE runs ADD COLUMN model TEXT", []);
        // Runs that were live when the app quit can't be reattached to a process.
        c.execute("UPDATE runs SET status='interrupted' WHERE status IN ('running','awaiting_approval','starting')", [])?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let _ = std::fs::set_permissions(path, std::fs::Permissions::from_mode(0o600));
        }
        Ok(Db(Mutex::new(c)))
    }

    pub fn get_setting(&self, k: &str) -> Option<String> {
        let c = self.0.lock().unwrap();
        c.query_row("SELECT value FROM settings WHERE key=?1", params![k], |r| {
            r.get(0)
        })
        .optional()
        .ok()
        .flatten()
    }

    pub fn set_setting(&self, k: &str, v: &str) -> rusqlite::Result<()> {
        let c = self.0.lock().unwrap();
        c.execute("INSERT INTO settings(key,value) VALUES(?1,?2) ON CONFLICT(key) DO UPDATE SET value=excluded.value", params![k, v])?;
        Ok(())
    }

    pub fn insert_run(&self, r: &RunSummary, ws: &str) -> rusqlite::Result<()> {
        let c = self.0.lock().unwrap();
        c.execute(
            "INSERT INTO runs(id,workflow,prompt,session_id,status,started_at,workspace,provider,model) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9)",
            params![
                r.id,
                r.workflow,
                r.prompt,
                r.session_id,
                r.status,
                r.started_at,
                ws,
                r.provider,
                r.model
            ],
        )?;
        Ok(())
    }

    pub fn set_run_provider(&self, id: &str, provider: &str, model: Option<&str>) {
        let c = self.0.lock().unwrap();
        let _ = c.execute(
            "UPDATE runs SET provider=?2, model=COALESCE(?3, model) WHERE id=?1",
            params![id, provider, model],
        );
    }

    pub fn set_run_session(&self, id: &str, session_id: &str) {
        let c = self.0.lock().unwrap();
        let _ = c.execute(
            "UPDATE runs SET session_id=?2 WHERE id=?1",
            params![id, session_id],
        );
    }

    pub fn finish_run(
        &self,
        id: &str,
        status: &str,
        cost: Option<f64>,
        summary: Option<&str>,
        error: Option<&str>,
        ts: i64,
    ) {
        let c = self.0.lock().unwrap();
        let _ = c.execute(
            "UPDATE runs SET status=?2, finished_at=?3, cost_usd=COALESCE(?4,cost_usd), summary=COALESCE(?5,summary), error=COALESCE(?6,error) WHERE id=?1",
            params![id, status, ts, cost, summary, error],
        );
    }

    pub fn set_run_status(&self, id: &str, status: &str) {
        let c = self.0.lock().unwrap();
        let _ = c.execute("UPDATE runs SET status=?2 WHERE id=?1", params![id, status]);
    }

    pub fn add_event(&self, run_id: &str, seq: i64, ts: i64, kind: &str, payload: &str) {
        let c = self.0.lock().unwrap();
        let _ = c.execute(
            "INSERT OR REPLACE INTO run_events(run_id,seq,ts,kind,payload) VALUES(?1,?2,?3,?4,?5)",
            params![run_id, seq, ts, kind, payload],
        );
    }

    pub fn list_runs(&self, limit: i64) -> rusqlite::Result<Vec<RunSummary>> {
        let c = self.0.lock().unwrap();
        let mut st = c.prepare(
            "SELECT id,workflow,prompt,session_id,status,started_at,finished_at,cost_usd,summary,error,provider,model FROM runs ORDER BY started_at DESC LIMIT ?1",
        )?;
        let rows = st.query_map(params![limit], |r| {
            Ok(RunSummary {
                id: r.get(0)?,
                workflow: r.get(1)?,
                prompt: r.get(2)?,
                session_id: r.get(3)?,
                status: r.get(4)?,
                started_at: r.get(5)?,
                finished_at: r.get(6)?,
                cost_usd: r.get(7)?,
                summary: r.get(8)?,
                error: r.get(9)?,
                provider: r.get(10)?,
                model: r.get(11)?,
            })
        })?;
        rows.collect()
    }

    pub fn run_events(&self, run_id: &str) -> rusqlite::Result<Vec<(i64, i64, String, String)>> {
        let c = self.0.lock().unwrap();
        let mut st =
            c.prepare("SELECT seq,ts,kind,payload FROM run_events WHERE run_id=?1 ORDER BY seq")?;
        let rows = st.query_map(params![run_id], |r| {
            Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?))
        })?;
        rows.collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn runs_persist_and_interrupt_on_reopen() {
        let d = tempfile::tempdir().unwrap();
        let p = d.path().join("t.db");
        {
            let db = Db::open(&p).unwrap();
            let r = RunSummary {
                id: "r1".into(),
                workflow: "scrape".into(),
                prompt: "x'; DROP TABLE runs;--".into(),
                session_id: "s".into(),
                status: "running".into(),
                started_at: 1,
                finished_at: None,
                cost_usd: None,
                summary: None,
                error: None,
                provider: Some("claude".into()),
                model: None,
            };
            db.insert_run(&r, "/ws").unwrap();
            db.add_event("r1", 1, 1, "assistant", "{}");
            db.set_setting("theme", "dark").unwrap();
        }
        let db = Db::open(&p).unwrap();
        let runs = db.list_runs(10).unwrap();
        assert_eq!(runs[0].status, "interrupted");
        assert_eq!(runs[0].prompt, "x'; DROP TABLE runs;--");
        assert_eq!(db.get_setting("theme").as_deref(), Some("dark"));
        assert_eq!(db.run_events("r1").unwrap().len(), 1);
    }
}
