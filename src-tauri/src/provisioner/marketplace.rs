use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct MarketplaceSource {
    pub id: String,
    pub name: String,
    pub source_type: String,
    pub manifest_path: String,
    pub plugin_count: u32,
    pub has_update: bool,
}

pub fn list_sources() -> Vec<MarketplaceSource> {
    vec![
        MarketplaceSource {
            id: "dcc-mcp-official".to_string(),
            name: "DCC-MCP Official".to_string(),
            source_type: "registry".to_string(),
            manifest_path: "https://registry.dcc-mcp.dev/v1/marketplace.json".to_string(),
            plugin_count: 6,
            has_update: false,
        },
        MarketplaceSource {
            id: "dcc-cua-local".to_string(),
            name: "DCC-CUA Local".to_string(),
            source_type: "local".to_string(),
            manifest_path: "~/.dcc-mcp/marketplaces/dcc-cua/marketplace.json".to_string(),
            plugin_count: 4,
            has_update: true,
        },
    ]
}

pub fn sync(source_id: &str) -> Result<(), String> {
    if source_id.trim().is_empty() {
        return Err("marketplace source id cannot be empty".to_string());
    }
    Err(format!("marketplace sync for {source_id} is scheduled for Phase 3"))
}
