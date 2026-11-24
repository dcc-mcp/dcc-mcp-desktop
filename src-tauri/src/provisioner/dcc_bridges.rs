use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct DetectedDcc {
    pub id: String,
    pub app_name: String,
    pub version: String,
    pub protocol: String,
    pub installed: bool,
    pub bridge_installed: bool,
}

pub fn scan() -> Vec<DetectedDcc> {
    vec![
        DetectedDcc { id: "blender-4.2".to_string(), app_name: "Blender".to_string(), version: "4.2".to_string(), protocol: "python_socket".to_string(), installed: true, bridge_installed: false },
        DetectedDcc { id: "maya-2025".to_string(), app_name: "Maya".to_string(), version: "2025".to_string(), protocol: "command_port".to_string(), installed: true, bridge_installed: false },
        DetectedDcc { id: "unreal-5.4".to_string(), app_name: "Unreal Engine".to_string(), version: "5.4".to_string(), protocol: "editor_ws".to_string(), installed: true, bridge_installed: false },
        DetectedDcc { id: "dcc-cua".to_string(), app_name: "DCC-CUA fallback".to_string(), version: "0.1".to_string(), protocol: "cua_window".to_string(), installed: true, bridge_installed: true },
    ]
}

pub fn install(dcc_id: &str) -> Result<(), String> {
    if dcc_id.trim().is_empty() {
        return Err("DCC id cannot be empty".to_string());
    }
    Err(format!("DCC bridge installation for {dcc_id} is scheduled for Phase 3"))
}
