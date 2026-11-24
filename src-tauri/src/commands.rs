use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Runtime};

use crate::provisioner::{agents, dcc_bridges, marketplace};
use crate::sidecar;
use crate::tray;

#[derive(Debug, Clone, Serialize)]
pub struct GatewayStatus {
    pub status: String,
    pub version: String,
    pub listen_mode: String,
    pub address: String,
    pub uptime_seconds: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum IngressMode {
    #[serde(rename = "cli")]
    Cli,
    #[serde(rename = "mcp")]
    Mcp,
    #[serde(rename = "dual")]
    Dual,
}

#[derive(Debug, Clone, Serialize)]
pub struct ProvisionResult {
    pub agent_id: String,
    pub enabled: bool,
    pub changed_files: Vec<String>,
    pub backup_files: Vec<String>,
    pub message: String,
}

#[tauri::command]
pub fn get_gateway_status() -> GatewayStatus {
    let online = sidecar::gateway_is_reachable();
    GatewayStatus {
        status: if online { "ok" } else { "offline" }.to_string(),
        version: if online { "detected" } else { "phase-1-mock" }.to_string(),
        listen_mode: "loopback".to_string(),
        address: format!("{}:{}", sidecar::DEFAULT_GATEWAY_HOST, sidecar::DEFAULT_GATEWAY_PORT),
        uptime_seconds: 0,
    }
}

#[tauri::command]
pub fn switch_gateway_profile(profile_id: String) -> Result<(), String> {
    if profile_id.trim().is_empty() {
        return Err("gateway profile id cannot be empty".to_string());
    }
    Ok(())
}

#[tauri::command]
pub fn scan_local_agents() -> Vec<agents::DetectedAgent> {
    agents::scan()
}

#[tauri::command]
pub fn provision_agent(
    agent_id: String,
    mode: IngressMode,
    enabled: bool,
) -> Result<ProvisionResult, String> {
    let mode = match mode {
        IngressMode::Cli => "cli",
        IngressMode::Mcp => "mcp",
        IngressMode::Dual => "dual",
    };
    let result = agents::provision(&agent_id, mode, enabled)?;
    Ok(ProvisionResult {
        agent_id,
        enabled,
        changed_files: result.changed_files,
        backup_files: result.backup_files,
        message: result.message,
    })
}

#[tauri::command]
pub fn scan_dcc_installations() -> Vec<dcc_bridges::DetectedDcc> {
    dcc_bridges::scan()
}

#[tauri::command]
pub fn install_dcc_bridge(dcc_id: String) -> Result<(), String> {
    dcc_bridges::install(&dcc_id)
}

#[tauri::command]
pub fn list_marketplace_sources() -> Vec<marketplace::MarketplaceSource> {
    marketplace::list_sources()
}

#[tauri::command]
pub fn sync_marketplace_source(source_id: String) -> Result<(), String> {
    marketplace::sync(&source_id)
}

#[tauri::command]
pub fn open_main_window<R: Runtime>(app: AppHandle<R>, route: Option<String>) -> Result<(), String> {
    tray::show_main_window(&app);
    if let Some(route) = route {
        app.emit("open-main-route", route)
            .map_err(|error| format!("failed to emit route event: {error}"))?;
    }
    Ok(())
}

#[tauri::command]
pub fn quit_app<R: Runtime>(app: AppHandle<R>) {
    app.exit(0);
}
