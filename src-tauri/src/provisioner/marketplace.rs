use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketplaceSource {
    pub id: String,
    pub name: String,
    pub source_type: String,
    pub manifest_path: String,
    pub plugin_count: u32,
    pub has_update: bool,
}

pub fn list_sources() -> Vec<MarketplaceSource> {
    let output = Command::new(crate::sidecar::CLI_SIDECAR)
        .args(["marketplace", "source", "list"])
        .output();
    let Ok(output) = output else {
        return fallback_sources();
    };
    if !output.status.success() {
        return fallback_sources();
    }
    let text = String::from_utf8_lossy(&output.stdout);
    if text.trim().is_empty() {
        return fallback_sources();
    }
    serde_json::from_str::<Vec<MarketplaceSource>>(&text).unwrap_or_else(|_| fallback_sources())
}

pub fn sync(source_id: &str) -> Result<(), String> {
    if source_id.trim().is_empty() {
        return Err("marketplace source id cannot be empty".to_string());
    }
    let status = Command::new(crate::sidecar::CLI_SIDECAR)
        .args(["marketplace", "update", "--all"])
        .status()
        .map_err(|error| format!("failed to launch dcc-mcp-cli: {error}"))?;
    if !status.success() {
        return Err(format!(
            "marketplace update for {source_id} exited with {status}"
        ));
    }
    Ok(())
}

fn fallback_sources() -> Vec<MarketplaceSource> {
    vec![MarketplaceSource {
        id: "dcc-mcp-official".to_string(),
        name: "DCC-MCP Official".to_string(),
        source_type: "registry".to_string(),
        manifest_path: "bundled:dcc-mcp-marketplace".to_string(),
        plugin_count: 0,
        has_update: false,
    }]
}
