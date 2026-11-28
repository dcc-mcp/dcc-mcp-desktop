use std::sync::Arc;

use serde::{Deserialize, Serialize};
use tauri::Wry;
use tauri::{AppHandle, Emitter, Runtime, State};

use crate::provisioner::{agents, dcc_bridges, marketplace};
use crate::sidecar::{self, SidecarLog, SidecarManager, SidecarStatus};
use crate::tray;

#[derive(Debug, Clone, Serialize)]
pub struct GatewayRuntimeStatus {
    pub sidecar: SidecarStatus,
    pub health: sidecar::GatewayHealth,
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
pub fn get_gateway_status(manager: State<'_, Arc<SidecarManager<Wry>>>) -> GatewayRuntimeStatus {
    let reachable = sidecar::gateway_is_reachable();
    GatewayRuntimeStatus {
        sidecar: manager.status(),
        health: sidecar::GatewayHealth {
            reachable,
            status: if reachable {
                "ok".to_string()
            } else {
                "offline".to_string()
            },
            version: None,
        },
    }
}

#[tauri::command]
pub fn get_gateway_logs(manager: State<'_, Arc<SidecarManager<Wry>>>) -> Vec<SidecarLog> {
    manager.logs()
}

#[tauri::command]
pub fn start_gateway(
    manager: State<'_, Arc<SidecarManager<Wry>>>,
) -> Result<SidecarStatus, String> {
    manager.start()
}

#[tauri::command]
pub fn stop_gateway(manager: State<'_, Arc<SidecarManager<Wry>>>) -> SidecarStatus {
    manager.stop()
}

#[tauri::command]
pub fn restart_gateway(
    manager: State<'_, Arc<SidecarManager<Wry>>>,
) -> Result<SidecarStatus, String> {
    manager.restart()
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
pub async fn install_dcc_bridge(app: AppHandle, dcc_id: String) -> Result<(), String> {
    dcc_bridges::install(&app, &dcc_id).await
}

#[tauri::command]
pub async fn list_marketplace_sources(
    app: AppHandle,
) -> Result<Vec<marketplace::MarketplaceSource>, String> {
    marketplace::list_sources(&app).await
}

#[tauri::command]
pub async fn sync_marketplace_source(app: AppHandle, source_id: String) -> Result<(), String> {
    marketplace::sync(&app, &source_id).await
}

#[tauri::command]
pub fn open_main_window<R: Runtime>(
    app: AppHandle<R>,
    route: Option<String>,
) -> Result<(), String> {
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
