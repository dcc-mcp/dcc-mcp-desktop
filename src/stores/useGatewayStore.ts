import { create } from 'zustand';
import type { GatewayCallEvent, LifecycleState } from '../types/gateway';

const now = () => new Date().toISOString();

const seedEvents: GatewayCallEvent[] = [
  {
    event_type: 'call_completed',
    trace_id: 'tr_8841c09',
    timestamp: now(),
    ingress: 'cli',
    agent: { id: 'codex', display_name: 'Codex', raw_command: 'dccmcp exec blender bake_pbr' },
    target: {
      instance_id: 'blender-01',
      dcc_app: 'blender',
      protocol: 'python_socket',
      scene_name: 'char_rig.blend',
    },
    skill_action: 'blender/bake_pbr',
    status: 'completed',
    duration_ms: 4200,
    retry_count: 1,
    artifact: {
      id: 'art-101',
      filename: 'char_rig_baked_2k.glb',
      path: '/Projects/Aether/assets/char_rig_baked_2k.glb',
    },
  },
  {
    event_type: 'call_started',
    trace_id: 'tr_8841b72',
    timestamp: now(),
    ingress: 'mcp',
    agent: { id: 'claude-code', display_name: 'Claude Code' },
    target: {
      instance_id: 'maya-01',
      dcc_app: 'maya',
      protocol: 'command_port',
      scene_name: 'lookdev.mb',
    },
    skill_action: 'maya/render_frame',
    status: 'running',
  },
];

interface GatewayStore {
  lifecycleState: LifecycleState;
  events: GatewayCallEvent[];
  gatewayOnline: boolean;
  setLifecycleState: (state: LifecycleState) => void;
  pushEvent: (event: GatewayCallEvent) => void;
  setGatewayOnline: (online: boolean) => void;
  startMockEvents: () => () => void;
}

const mockSequence: Array<Pick<GatewayCallEvent, 'status' | 'event_type'>> = [
  { status: 'connected', event_type: 'instance_updated' },
  { status: 'running', event_type: 'call_started' },
  { status: 'completed', event_type: 'call_completed' },
  { status: 'failed', event_type: 'call_failed' },
];

export const useGatewayStore = create<GatewayStore>((set, get) => ({
  lifecycleState: 'connected',
  events: seedEvents,
  gatewayOnline: true,
  setLifecycleState: (lifecycleState) => set({ lifecycleState }),
  pushEvent: (event) =>
    set((state) => ({
      events: [event, ...state.events].slice(0, 40),
      lifecycleState: event.status,
    })),
  setGatewayOnline: (gatewayOnline) => set({ gatewayOnline }),
  startMockEvents: () => {
    let sequenceIndex = 0;
    const timer = window.setInterval(() => {
      const step = mockSequence[sequenceIndex % mockSequence.length];
      sequenceIndex += 1;
      const status = step.status;
      const event: GatewayCallEvent = {
        event_type: step.event_type,
        trace_id: `mock_${Date.now()}`,
        timestamp: now(),
        ingress: sequenceIndex % 2 === 0 ? 'mcp' : 'cli',
        agent: {
          id: sequenceIndex % 2 === 0 ? 'claude-code' : 'codex',
          display_name: sequenceIndex % 2 === 0 ? 'Claude Code' : 'Codex',
          raw_command: 'dccmcp exec blender export_glb',
        },
        target: {
          instance_id: sequenceIndex % 2 === 0 ? 'maya-01' : 'blender-01',
          dcc_app: sequenceIndex % 2 === 0 ? 'maya' : 'blender',
          protocol: sequenceIndex % 2 === 0 ? 'command_port' : 'python_socket',
          scene_name: sequenceIndex % 2 === 0 ? 'lookdev.mb' : 'char_rig.blend',
        },
        skill_action: sequenceIndex % 2 === 0 ? 'maya/render_frame' : 'blender/export_glb',
        status,
        duration_ms: status === 'completed' ? 4200 : undefined,
        retry_count: status === 'failed' ? 2 : undefined,
        error:
          status === 'failed'
            ? { code: 'BRIDGE_TIMEOUT', message: 'DCC bridge did not answer before the deadline.' }
            : undefined,
      };
      get().pushEvent(event);
    }, 3200);
    return () => window.clearInterval(timer);
  },
}));
