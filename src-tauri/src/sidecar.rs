use std::net::{IpAddr, Ipv4Addr, SocketAddr, TcpStream};
use std::process::{Child, Command};
use std::time::Duration;

pub const DEFAULT_GATEWAY_HOST: &str = "127.0.0.1";
pub const DEFAULT_GATEWAY_PORT: u16 = 18_730;

pub fn gateway_is_reachable() -> bool {
    let address = SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), DEFAULT_GATEWAY_PORT);
    TcpStream::connect_timeout(&address, Duration::from_millis(350)).is_ok()
}

#[allow(dead_code)]
pub fn spawn_gateway_sidecar() -> Result<Child, String> {
    Command::new("dcc-mcp-gateway")
        .arg("gateway")
        .spawn()
        .map_err(|error| format!("failed to start dcc-mcp-gateway: {error}"))
}
