use serde::Serialize;
use std::path::PathBuf;

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
        DetectedDcc {
            id: "blender-4.2".to_string(),
            app_name: "Blender".to_string(),
            version: "4.2".to_string(),
            protocol: "python_socket".to_string(),
            installed: is_installed(&[
                "C:/Program Files/Blender Foundation/Blender 4.2/blender.exe",
            ]),
            bridge_installed: has_skill("blender"),
        },
        DetectedDcc {
            id: "maya-2025".to_string(),
            app_name: "Maya".to_string(),
            version: "2025".to_string(),
            protocol: "command_port".to_string(),
            installed: is_installed(&["C:/Program Files/Autodesk/Maya2025/bin/maya.exe"]),
            bridge_installed: has_skill("maya"),
        },
        DetectedDcc {
            id: "unreal-5.4".to_string(),
            app_name: "Unreal Engine".to_string(),
            version: "5.4".to_string(),
            protocol: "editor_ws".to_string(),
            installed: is_installed(&[
                "C:/Program Files/Epic Games/UE_5.4/Engine/Binaries/Win64/UnrealEditor.exe",
            ]),
            bridge_installed: has_skill("unreal"),
        },
        DetectedDcc {
            id: "dcc-cua".to_string(),
            app_name: "DCC-CUA fallback".to_string(),
            version: "0.1".to_string(),
            protocol: "cua_window".to_string(),
            installed: command_exists("dcc-cua"),
            bridge_installed: command_exists("dcc-cua"),
        },
    ]
}

pub async fn install<R: tauri::Runtime>(
    app: &tauri::AppHandle<R>,
    dcc_id: &str,
) -> Result<(), String> {
    if dcc_id.trim().is_empty() {
        return Err("DCC id cannot be empty".to_string());
    }
    let (id, _) = dcc_id.split_once('@').unwrap_or((dcc_id, ""));
    let adapter = match id.to_ascii_lowercase().as_str() {
        "blender" | "maya" | "unreal" => id.to_ascii_lowercase(),
        "dcc-cua" => {
            return Err("install the independently released dcc-cua runtime for CUA support".to_string());
        }
        _ => return Err(format!("unsupported DCC id: {id}")),
    };
    crate::sidecar::run_cli(app, &["install", &adapter]).await?;
    Ok(())
}

fn is_installed(paths: &[&str]) -> bool {
    paths.iter().any(|path| PathBuf::from(path).exists())
}

fn has_skill(dcc: &str) -> bool {
    let home = std::env::var("USERPROFILE")
        .or_else(|_| std::env::var("HOME"))
        .unwrap_or_else(|_| ".".to_string());
    [
        ".codex/skills/dcc-mcp",
        ".claude/plugins/dcc-mcp",
        ".dcc-mcp/skills",
    ]
    .iter()
    .any(|relative| PathBuf::from(&home).join(relative).join(dcc).exists())
}

fn command_exists(command: &str) -> bool {
    let probe = if cfg!(windows) { "where" } else { "which" };
    std::process::Command::new(probe)
        .arg(command)
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .status()
        .map(|status| status.success())
        .unwrap_or(false)
}
