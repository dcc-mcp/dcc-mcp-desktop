export type MarketplaceSourceType = 'local' | 'git' | 'registry';

export interface MarketplaceSource {
  id: string;
  name: string;
  source_type: MarketplaceSourceType;
  manifest_path: string;
  plugin_count: number;
  has_update: boolean;
}

export interface MarketplaceItem {
  id: string;
  name: string;
  kind: 'plugin' | 'app' | 'mcp' | 'skill';
  version: string;
  enabled: boolean;
  source_id: string;
  description: string;
}
