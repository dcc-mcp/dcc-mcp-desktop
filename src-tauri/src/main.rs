mod commands;
mod provisioner;
mod sidecar;
mod tray;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
fn run() {
    tauri::Builder::default()
        .setup(|app| {
            tray::install(app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_gateway_status,
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
        .run(tauri::generate_context!())
        .expect("error while running dcc-mcp-desktop");
}

fn main() {
    run();
}
