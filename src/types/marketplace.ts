export type MarketplaceSourceType = 'builtin' | 'config' | 'env' | 'explicit';

export interface MarketplaceSource {
  id: string;
  name: string;
  source_type: MarketplaceSourceType;
  manifest_path: string;
  plugin_count: number | null;
  has_update: boolean | null;
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
