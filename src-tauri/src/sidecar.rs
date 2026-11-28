use std::collections::VecDeque;
use std::net::{IpAddr, Ipv4Addr, SocketAddr, TcpStream};
use std::path::PathBuf;
use std::sync::{Arc, Mutex, MutexGuard};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, Runtime};
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;

pub const GATEWAY_HOST: &str = "127.0.0.1";
pub const GATEWAY_PORT: u16 = 9_765;
pub const GATEWAY_SIDECAR: &str = "dcc-mcp-server";
pub const CLI_SIDECAR: &str = "dccmcp";

pub async fn run_cli<R: Runtime>(app: &AppHandle<R>, args: &[&str]) -> Result<Vec<u8>, String> {
    let output = app
        .shell()
        .sidecar(CLI_SIDECAR)
        .map_err(|err| format!("failed to resolve bundled {CLI_SIDECAR}: {err}"))?
        .args(args)
        .env("DCC_MCP_CLI_AUTO_UPDATE", "false")
        .env("DCC_MCP_CLI_NO_UPDATE_MAINTENANCE", "true")
        .output()
        .await
        .map_err(|err| format!("failed to run {CLI_SIDECAR}: {err}"))?;
    if !output.status.success() {
        return Err(format!(
            "{CLI_SIDECAR} exited with {:?}: {}",
            output.status.code(),
            String::from_utf8_lossy(&output.stderr).trim()
        ));
    }
    Ok(output.stdout)
}

const MAX_LOG_LINES: usize = 200;
const READY_TIMEOUT: Duration = Duration::from_secs(15);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum SidecarState {
    Stopped,
    Starting,
    Running,
    Failed,
}

#[derive(Debug, Clone, Serialize)]
pub struct SidecarStatus {
    pub state: SidecarState,
    pub mode: String,
    pub pid: Option<u32>,
    pub started_at: Option<String>,
    pub last_error: Option<String>,
    pub binary: String,
    pub host: String,
    pub port: u16,
}

#[derive(Debug, Clone, Serialize)]
pub struct SidecarLog {
    pub timestamp: String,
    pub stream: String,
    pub message: String,
}

impl SidecarStatus {
    fn stopped() -> Self {
        Self {
            state: SidecarState::Stopped,
            mode: "stopped".to_string(),
            pid: None,
            started_at: None,
            last_error: None,
            binary: GATEWAY_SIDECAR.to_string(),
            host: GATEWAY_HOST.to_string(),
            port: GATEWAY_PORT,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct GatewayArguments {
    pub host: String,
    pub port: u16,
    pub remote_port: u16,
    pub registry_dir: PathBuf,
}

impl GatewayArguments {
    pub fn for_app<R: Runtime>(app: &AppHandle<R>) -> Result<Self, String> {
        let registry_dir = app
            .path()
            .app_local_data_dir()
            .map_err(|error| format!("failed to resolve application data directory: {error}"))?
            .join("gateway-registry");
        Ok(Self {
            host: GATEWAY_HOST.to_string(),
            port: GATEWAY_PORT,
            remote_port: 0,
            registry_dir,
        })
    }

    pub fn to_command_args(&self) -> Vec<String> {
        vec![
            "gateway".to_string(),
            "--host".to_string(),
            self.host.clone(),
            "--port".to_string(),
            self.port.to_string(),
            "--remote-port".to_string(),
            self.remote_port.to_string(),
            "--registry-dir".to_string(),
            self.registry_dir.to_string_lossy().into_owned(),
            "--gateway-persist".to_string(),
            "--name".to_string(),
            "dcc-mcp-desktop".to_string(),
        ]
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct GatewayHealth {
    pub reachable: bool,
    pub status: String,
    pub version: Option<String>,
}

#[derive(Debug, Clone, Copy)]
pub struct GatewayLauncher;

impl GatewayLauncher {
    fn spawn<R: Runtime>(
        app: &AppHandle<R>,
        args: &GatewayArguments,
    ) -> Result<(CommandChild, u32), String> {
        let command_args = args.to_command_args();
        let (receiver, child) = app
            .shell()
            .sidecar(GATEWAY_SIDECAR)
            .map_err(|error| format!("gateway sidecar is not configured: {error}"))?
            .args(&command_args)
            .kill_on_drop(true)
            .spawn()
            .map_err(|error| format!("failed to start gateway sidecar: {error}"))?;
        let pid = child.pid();
        let app_for_logs = app.clone();
        let (tx, mut rx) = tauri::async_runtime::channel(64);
        tauri::async_runtime::spawn(async move {
            while let Some(event) = rx.recv().await {
                let entry = match event {
                    CommandEvent::Stdout(bytes) | CommandEvent::Stderr(bytes) => Some((
                        "gateway".to_string(),
                        String::from_utf8_lossy(&bytes).trim_end().to_string(),
                    )),
                    CommandEvent::Terminated(payload) => Some((
                        "gateway".to_string(),
                        format!("gateway process exited: {payload:?}"),
                    )),
                    CommandEvent::Error(error) => Some((
                        "gateway".to_string(),
                        format!("gateway process error: {error}"),
                    )),
                    _ => None,
                };
                if let Some((stream, message)) = entry {
                    let log = SidecarLog {
                        timestamp: timestamp(),
                        stream,
                        message,
                    };
                    let manager = app_for_logs.state::<Arc<SidecarManager<R>>>();
                    let mut state = lock(&manager.state);
                    state.logs.push_back(log.clone());
                    while state.logs.len() > MAX_LOG_LINES {
                        state.logs.pop_front();
                    }
                    let _ = app_for_logs.emit("gateway://log", &log);
                }
            }
        });
        tauri::async_runtime::spawn(async move {
            let mut receiver = receiver;
            while let Some(event) = receiver.recv().await {
                let is_terminal =
                    matches!(event, CommandEvent::Terminated(_) | CommandEvent::Error(_));
                if tx.send(event).await.is_err() || is_terminal {
                    break;
                }
            }
        });
        Ok((child, pid))
    }
}

struct RuntimeState {
    status: SidecarStatus,
    child: Option<CommandChild>,
    logs: VecDeque<SidecarLog>,
}

pub struct SidecarManager<R: Runtime> {
    app: AppHandle<R>,
    state: Arc<Mutex<RuntimeState>>,
}

impl<R: Runtime> SidecarManager<R> {
    pub fn new(app: AppHandle<R>) -> Self {
        Self {
            app,
            state: Arc::new(Mutex::new(RuntimeState {
                status: SidecarStatus::stopped(),
                child: None,
                logs: VecDeque::new(),
            })),
        }
    }

    pub fn status(&self) -> SidecarStatus {
        lock(&self.state).status.clone()
    }

    pub fn logs(&self) -> Vec<SidecarLog> {
        lock(&self.state).logs.iter().cloned().collect()
    }

    pub fn start(&self) -> Result<SidecarStatus, String> {
        if gateway_is_reachable() {
            let mut state = lock(&self.state);
            state.status = SidecarStatus {
                state: SidecarState::Running,
                mode: "external".to_string(),
                pid: None,
                started_at: None,
                last_error: None,
                binary: GATEWAY_SIDECAR.to_string(),
                host: GATEWAY_HOST.to_string(),
                port: GATEWAY_PORT,
            };
            emit_status(&self.app, &state.status);
            return Ok(state.status.clone());
        }

        {
            let mut state = lock(&self.state);
            if state.status.state == SidecarState::Starting {
                return Ok(state.status.clone());
            }
            if let Some(child) = state.child.take() {
                let _ = child.kill();
            }
            state.status = SidecarStatus {
                state: SidecarState::Starting,
                mode: "bundled".to_string(),
                ..SidecarStatus::stopped()
            };
            emit_status(&self.app, &state.status);
        }

        let args = GatewayArguments::for_app(&self.app)?;
        if let Err(error) = std::fs::create_dir_all(&args.registry_dir) {
            return self.fail(format!(
                "failed to create gateway registry directory: {error}"
            ));
        }

        let (child, pid) = match GatewayLauncher::spawn(&self.app, &args) {
            Ok(result) => result,
            Err(error) => return self.fail(error),
        };

        {
            let mut state = lock(&self.state);
            state.child = Some(child);
            state.status.pid = Some(pid);
            state.status.state = SidecarState::Running;
            state.status.started_at = Some(timestamp());
            state.status.last_error = None;
            emit_status(&self.app, &state.status);
        }

        match wait_until_ready(READY_TIMEOUT) {
            Ok(()) => Ok(self.status()),
            Err(error) => {
                self.stop();
                Err(error)
            }
        }
    }

    pub fn stop(&self) -> SidecarStatus {
        let status = {
            let mut state = lock(&self.state);
            if let Some(mut child) = state.child.take() {
                let _ = child.write("shutdown\n".as_bytes());
                let _ = child.kill();
            }
            state.status = SidecarStatus::stopped();
            emit_status(&self.app, &state.status);
            state.status.clone()
        };
        status
    }

    pub fn restart(&self) -> Result<SidecarStatus, String> {
        self.stop();
        self.start()
    }

    fn fail(&self, error: String) -> Result<SidecarStatus, String> {
        let mut state = lock(&self.state);
        state.status.state = SidecarState::Failed;
        state.status.last_error = Some(error.clone());
        state.status.pid = None;
        emit_status(&self.app, &state.status);
        Err(error)
    }
}

fn lock<T>(state: &Arc<Mutex<T>>) -> MutexGuard<'_, T> {
    state.lock().unwrap_or_else(|error| error.into_inner())
}

fn emit_status<R: Runtime>(app: &AppHandle<R>, status: &SidecarStatus) {
    let _ = app.emit("gateway://status", status);
}

fn timestamp() -> String {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
        .to_string()
}

pub fn gateway_is_reachable() -> bool {
    gateway_is_reachable_with_timeout(Duration::from_millis(350))
}

fn gateway_is_reachable_with_timeout(timeout: Duration) -> bool {
    let address = SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), GATEWAY_PORT);
    TcpStream::connect_timeout(&address, timeout).is_ok()
}

fn wait_until_ready(timeout: Duration) -> Result<(), String> {
    let deadline = Instant::now() + timeout;
    while Instant::now() < deadline {
        if gateway_is_reachable_with_timeout(Duration::from_millis(350)) {
            return Ok(());
        }
        std::thread::sleep(Duration::from_millis(250));
    }
    Err(format!(
        "gateway sidecar did not become ready on {GATEWAY_HOST}:{GATEWAY_PORT}"
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn gateway_arguments_use_the_core_contract() {
        let args = GatewayArguments {
            host: GATEWAY_HOST.to_string(),
            port: GATEWAY_PORT,
            remote_port: 0,
            registry_dir: PathBuf::from("C:/dcc-mcp/gateway-registry"),
        };
        assert_eq!(
            args.to_command_args(),
            vec![
                "gateway",
                "--host",
                "127.0.0.1",
                "--port",
                "9765",
                "--remote-port",
                "0",
                "--registry-dir",
                "C:/dcc-mcp/gateway-registry",
                "--gateway-persist",
                "--name",
                "dcc-mcp-desktop",
            ]
        );
    }

    #[test]
    fn log_buffer_is_bounded() {
        let mut logs = VecDeque::new();
        for index in 0..(MAX_LOG_LINES + 5) {
            logs.push_back(index);
            while logs.len() > MAX_LOG_LINES {
                logs.pop_front();
            }
        }
        assert_eq!(logs.len(), MAX_LOG_LINES);
        assert_eq!(logs.front(), Some(&5));
    }
}
