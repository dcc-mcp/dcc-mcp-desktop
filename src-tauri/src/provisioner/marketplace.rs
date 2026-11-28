use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Runtime};

use crate::sidecar::run_cli;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketplaceSource {
    pub id: String,
    pub name: String,
    pub source_type: String,
    pub manifest_path: String,
    pub plugin_count: Option<u32>,
    pub has_update: Option<bool>,
}

#[derive(Deserialize)]
struct CliSource {
    name: String,
    url: String,
    origin: String,
}

pub async fn list_sources<R: Runtime>(
    app: &AppHandle<R>,
) -> Result<Vec<MarketplaceSource>, String> {
    let bytes = run_cli(app, &["--output", "json", "marketplace", "list"]).await?;
    let sources: Vec<CliSource> =
        serde_json::from_slice(&bytes).map_err(|err| format!("invalid marketplace list: {err}"))?;
    Ok(sources
        .into_iter()
        .map(|source| MarketplaceSource {
            id: source.name.clone(),
            name: source.name,
            source_type: source.origin,
            manifest_path: source.url,
            plugin_count: None,
            has_update: None,
        })
        .collect())
}

pub async fn sync<R: Runtime>(app: &AppHandle<R>, source_id: &str) -> Result<(), String> {
    if source_id.trim().is_empty() {
        return Err("marketplace source id cannot be empty".to_string());
    }
    run_cli(app, &["marketplace", "update", "--all"]).await?;
    Ok(())
}
