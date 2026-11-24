import { create } from 'zustand';
import { localGatewayClient } from '../api/gatewayClient';
import {
  getGatewayStatus,
  restartGateway,
  startGateway,
  stopGateway,
} from '../api/tauriCommands';
import type {
  DccInstance,
  GatewayCallEvent,
  GatewayRuntimeStatus,
  SidecarLog,
  SidecarStatus,
} from '../types/gateway';

const emptyStatus: GatewayRuntimeStatus = {
  sidecar: {
    state: 'stopped',
    mode: 'stopped',
    pid: null,
    started_at: null,
    last_error: null,
    binary: 'dcc-mcp-server',
    host: '127.0.0.1',
    port: 9765,
  },
  health: { reachable: false, status: 'offline', version: null },
};

interface GatewayStore {
  runtime: GatewayRuntimeStatus;
  events: GatewayCallEvent[];
  instances: DccInstance[];
  logs: SidecarLog[];
  connectionError: string | null;
  refreshGateway: () => Promise<void>;
  connectGateway: () => () => void;
  startGateway: () => Promise<void>;
  stopGateway: () => Promise<void>;
  restartGateway: () => Promise<void>;
  setRuntime: (runtime: GatewayRuntimeStatus) => void;
  setLog: (log: SidecarLog) => void;
}

const message = (error: unknown) => (error instanceof Error ? error.message : String(error));

export const useGatewayStore = create<GatewayStore>((set) => ({
  runtime: emptyStatus,
  events: [],
  instances: [],
  logs: [],
  connectionError: null,
  refreshGateway: async () => {
    try {
      const [runtime, instances, calls] = await Promise.all([
        getGatewayStatus(),
        localGatewayClient.getInstances(),
        localGatewayClient.getCalls(),
      ]);
      set({ runtime, instances, events: calls, connectionError: null });
    } catch (error) {
      set({ connectionError: message(error) });
    }
  },
  connectGateway: () => {
    const stopEvents = localGatewayClient.subscribe((event) => {
      const call = event as unknown as GatewayCallEvent;
      if (!call.trace_id) {
        return;
      }
      set((state) => ({
        events: [call, ...state.events].slice(0, 200),
      }));
    });
    return stopEvents;
  },
  startGateway: async () => {
    try {
      await startGateway();
      await useGatewayStore.getState().refreshGateway();
    } catch (error) {
      set({ connectionError: message(error) });
    }
  },
  stopGateway: async () => {
    try {
      await stopGateway();
      await useGatewayStore.getState().refreshGateway();
    } catch (error) {
      set({ connectionError: message(error) });
    }
  },
  restartGateway: async () => {
    try {
      await restartGateway();
      await useGatewayStore.getState().refreshGateway();
    } catch (error) {
      set({ connectionError: message(error) });
    }
  },
  setRuntime: (runtime) => set({ runtime }),
  setLog: (log) =>
    set((state) => ({ logs: [...state.logs, log].slice(-200) })),
}));
