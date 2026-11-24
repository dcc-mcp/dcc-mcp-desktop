export type IngressMode = 'cli' | 'mcp' | 'dual';

export interface DetectedAgent {
  id: string;
  display_name: string;
  version: string;
  installed: boolean;
  connected: boolean;
  config_path: string | null;
  supported_ingress: IngressMode[];
}

export interface ProvisionResult {
  agent_id: string;
  enabled: boolean;
  changed_files: string[];
  backup_files: string[];
  message: string;
}
