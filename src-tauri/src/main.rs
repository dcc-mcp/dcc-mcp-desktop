mod commands;
mod provisioner;
mod sidecar;
mod tray;

use std::sync::Arc;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let manager = Arc::new(sidecar::SidecarManager::new(app.handle().clone()));
            app.manage(manager);
            tray::install(app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_gateway_status,
            commands::get_gateway_logs,
            commands::start_gateway,
            commands::stop_gateway,
            commands::restart_gateway,
            commands::switch_gateway_profile,
            commands::scan_local_agents,
            commands::provision_agent,
            commands::scan_dcc_installations,
            commands::install_dcc_bridge,
            commands::list_marketplace_sources,
            commands::sync_marketplace_source,
            commands::open_main_window,
            commands::quit_app,
        ])
        .build(tauri::generate_context!())
        .expect("error while building dcc-mcp-desktop");

    if let Some(manager) = app.try_state::<Arc<sidecar::SidecarManager<tauri::Wry>>>() {
        manager.stop();
    }

    app.run(|_, _| {});
}

fn main() {
    run();
}
