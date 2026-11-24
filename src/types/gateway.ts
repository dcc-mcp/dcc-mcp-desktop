export type LifecycleState = 'connected' | 'running' | 'failed' | 'completed';

export type GatewayIngress = 'cli' | 'mcp';

export type DccProtocol =
  | 'python_socket'
  | 'command_port'
  | 'editor_ws'
  | 'cua_window';

export interface GatewayHealth {
  status: 'ok' | 'degraded' | 'offline';
  version: string;
  listen_mode: 'loopback' | 'lan';
  address: string;
  uptime_seconds: number;
}

export interface GatewayCallEvent {
  event_type:
    | 'call_started'
    | 'call_progress'
    | 'call_completed'
    | 'call_failed'
    | 'instance_updated';
  trace_id: string;
  timestamp: string;
  ingress: GatewayIngress;
  agent: {
    id: string;
    display_name: string;
    session_id?: string;
    raw_command?: string;
  };
  target: {
    instance_id: string;
    dcc_app: string;
    protocol: DccProtocol;
    scene_name?: string;
  };
  skill_action: string;
  status: LifecycleState;
  duration_ms?: number;
  retry_count?: number;
  error?: {
    code: string;
    message: string;
    screenshot_path?: string;
  };
  artifact?: {
    id: string;
    filename: string;
    path: string;
    preview_url?: string;
  };
}

export interface DccInstance {
  instance_id: string;
  dcc_app: string;
  version: string;
  pid: number;
  protocol: DccProtocol;
  scene_path: string | null;
  scene_basename: string | null;
  is_dirty: boolean;
  status: 'connected' | 'busy' | 'error';
  loaded_skills: string[];
  active_trace_id?: string;
}

export interface GatewayCallRecord extends GatewayCallEvent {
  completed_at?: string;
}
