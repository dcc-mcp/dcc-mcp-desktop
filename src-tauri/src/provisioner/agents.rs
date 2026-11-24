use serde::Serialize;
use std::env;

#[derive(Debug, Clone, Serialize)]
pub struct DetectedAgent {
    pub id: String,
    pub display_name: String,
    pub version: String,
    pub installed: bool,
    pub connected: bool,
    pub config_path: Option<String>,
    pub supported_ingress: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct ProvisionOutput {
    pub changed_files: Vec<String>,
    pub backup_files: Vec<String>,
    pub message: String,
}

pub fn scan() -> Vec<DetectedAgent> {
    let home = env::var("USERPROFILE")
        .or_else(|_| env::var("HOME"))
        .unwrap_or_else(|_| "~".to_string());
    vec![
        DetectedAgent {
            id: "codex".to_string(),
            display_name: "Codex".to_string(),
            version: "detected by PATH".to_string(),
            installed: true,
            connected: false,
            config_path: Some(format!("{home}/.codex/skills/dcc-mcp/SKILL.md")),
            supported_ingress: vec!["cli".to_string(), "dual".to_string()],
        },
        DetectedAgent {
            id: "claude-code".to_string(),
            display_name: "Claude Code".to_string(),
            version: "detected by PATH".to_string(),
            installed: true,
            connected: false,
            config_path: Some(format!(
                "{home}/.claude/plugins/dcc-mcp/.claude-plugin/plugin.json"
            )),
            supported_ingress: vec!["cli".to_string(), "dual".to_string()],
        },
        DetectedAgent {
            id: "cursor".to_string(),
            display_name: "Cursor".to_string(),
            version: "config probe".to_string(),
            installed: true,
            connected: false,
            config_path: Some(format!("{home}/.cursor/mcp.json")),
            supported_ingress: vec!["mcp".to_string(), "dual".to_string()],
        },
    ]
}

pub fn provision(agent_id: &str, mode: &str, enabled: bool) -> Result<ProvisionOutput, String> {
    if agent_id.trim().is_empty() {
        return Err("agent id cannot be empty".to_string());
    }
    if !matches!(mode, "cli" | "mcp" | "dual") {
        return Err(format!("unsupported ingress mode: {mode}"));
    }
    Ok(ProvisionOutput {
        changed_files: Vec::new(),
        backup_files: Vec::new(),
        message: if enabled {
            format!("Provisioning preview ready for {agent_id} using {mode}; no files changed in Phase 1.")
        } else {
            format!(
                "Disable preview ready for {agent_id}; owned entries will be removed after backup."
            )
        },
    })
}
