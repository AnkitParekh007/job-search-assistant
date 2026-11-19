//! OS-native credential storage. Secrets never enter SQLite or the renderer
//! beyond a short-lived secure input flow.

pub mod credentials;
