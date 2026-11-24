use serde::Serialize;
use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

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

const OWNED_MARKER: &str = "# Managed by dcc-mcp-desktop";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Ingress {
    Cli,
    Mcp,
    Dual,
}

impl Ingress {
    fn parse(value: &str) -> Result<Self, String> {
        match value {
            "cli" => Ok(Self::Cli),
            "mcp" => Ok(Self::Mcp),
            "dual" => Ok(Self::Dual),
            _ => Err(format!("unsupported ingress mode: {value}")),
        }
    }

    fn as_str(self) -> &'static str {
        match self {
            Self::Cli => "cli",
            Self::Mcp => "mcp",
            Self::Dual => "dual",
        }
    }
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
            version: detect_version("codex"),
            installed: command_exists("codex"),
            connected: config_contains(
                &home_config_path(".codex/skills/dcc-mcp/SKILL.md"),
                OWNED_MARKER,
            ),
            config_path: Some(format!("{home}/.codex/skills/dcc-mcp/SKILL.md")),
            supported_ingress: vec!["cli".to_string(), "dual".to_string()],
        },
        DetectedAgent {
            id: "claude-code".to_string(),
            display_name: "Claude Code".to_string(),
            version: detect_version("claude"),
            installed: command_exists("claude"),
            connected: config_contains(
                &home_config_path(".claude/plugins/dcc-mcp/.claude-plugin/plugin.json"),
                OWNED_MARKER,
            ),
            config_path: Some(format!(
                "{home}/.claude/plugins/dcc-mcp/.claude-plugin/plugin.json"
            )),
            supported_ingress: vec!["cli".to_string(), "dual".to_string()],
        },
        DetectedAgent {
            id: "cursor".to_string(),
            display_name: "Cursor".to_string(),
            version: "config probe".to_string(),
            installed: home_config_path(".cursor/mcp.json").exists(),
            connected: config_contains(&home_config_path(".cursor/mcp.json"), OWNED_MARKER),
            config_path: Some(format!("{home}/.cursor/mcp.json")),
            supported_ingress: vec!["mcp".to_string(), "dual".to_string()],
        },
    ]
}

pub fn provision(agent_id: &str, mode: &str, enabled: bool) -> Result<ProvisionOutput, String> {
    if agent_id.trim().is_empty() {
        return Err("agent id cannot be empty".to_string());
    }
    let ingress = Ingress::parse(mode)?;
    let path = agent_config_path(agent_id)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("failed to create {}: {error}", parent.display()))?;
    }
    let backup_files = backup_file(&path)?;
    let content = if enabled {
        format!(
            "{OWNED_MARKER}\n{{\n  \"agent\": \"{agent_id}\",\n  \"ingress\": \"{}\",\n  \"gateway\": \"http://127.0.0.1:9765\"\n}}\n",
            ingress.as_str()
        )
    } else {
        format!("{OWNED_MARKER}\n{{\n  \"agent\": \"{agent_id}\",\n  \"enabled\": false\n}}\n")
    };
    fs::write(&path, content)
        .map_err(|error| format!("failed to write {}: {error}", path.display()))?;
    Ok(ProvisionOutput {
        changed_files: vec![path.to_string_lossy().into_owned()],
        backup_files,
        message: format!("Updated owned dcc-mcp configuration for {agent_id}."),
    })
}

fn home_config_path(relative: &str) -> PathBuf {
    let home = env::var("USERPROFILE")
        .or_else(|_| env::var("HOME"))
        .unwrap_or_else(|_| ".".to_string());
    PathBuf::from(home).join(relative)
}

fn agent_config_path(agent_id: &str) -> Result<PathBuf, String> {
    match agent_id {
        "codex" => Ok(home_config_path(".codex/skills/dcc-mcp/SKILL.md")),
        "claude-code" => Ok(home_config_path(
            ".claude/plugins/dcc-mcp/.claude-plugin/plugin.json",
        )),
        "cursor" => Ok(home_config_path(".cursor/mcp.json")),
        _ => Err(format!("unsupported agent id: {agent_id}")),
    }
}

fn backup_file(path: &Path) -> Result<Vec<String>, String> {
    if !path.exists() {
        return Ok(Vec::new());
    }
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    let backup = path.with_extension(format!("dcc-mcp-desktop-{timestamp}.bak"));
    fs::copy(path, &backup)
        .map_err(|error| format!("failed to back up {}: {error}", path.display()))?;
    Ok(vec![backup.to_string_lossy().into_owned()])
}

fn config_contains(path: &Path, needle: &str) -> bool {
    fs::read_to_string(path)
        .map(|content| content.contains(needle))
        .unwrap_or(false)
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

fn detect_version(command: &str) -> String {
    let output = std::process::Command::new(command)
        .arg("--version")
        .output();
    match output {
        Ok(output) if output.status.success() => {
            let text = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if text.is_empty() {
                "detected".to_string()
            } else {
                text
            }
        }
        _ => "not detected".to_string(),
    }
}
