import type {
  DccInstance,
  GatewayCallEvent,
  GatewayCallRecord,
  GatewayHealth,
} from '../types/gateway';

export interface GatewayClientOptions {
  baseUrl: string;
  reconnect?: {
    initialDelayMs?: number;
    maxDelayMs?: number;
  };
}

export type EventListener = (event: GatewayCallEvent) => void;

export class GatewayClient {
  private readonly baseUrl: string;
  private readonly initialDelayMs: number;
  private readonly maxDelayMs: number;
  private eventSource: EventSource | null = null;
  private reconnectTimer: number | null = null;
  private stopped = false;
  private retryCount = 0;

  constructor(options: GatewayClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.initialDelayMs = options.reconnect?.initialDelayMs ?? 500;
    this.maxDelayMs = options.reconnect?.maxDelayMs ?? 10_000;
  }

  async getHealth(): Promise<GatewayHealth> {
    return this.get<GatewayHealth>('/api/v1/health');
  }

  async getInstances(): Promise<DccInstance[]> {
    return this.get<DccInstance[]>('/api/v1/instances');
  }

  async getCalls(page = 1, pageSize = 50): Promise<GatewayCallRecord[]> {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    return this.get<GatewayCallRecord[]>(`/api/v1/calls?${params.toString()}`);
  }

  async retryCall(traceId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/v1/calls/${encodeURIComponent(traceId)}/retry`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Gateway retry failed with HTTP ${response.status}`);
    }
  }

  subscribe(listener: EventListener): () => void {
    this.stopped = false;
    this.openEventStream(listener);
    return () => this.stopEvents();
  }

  stopEvents(): void {
    this.stopped = true;
    this.eventSource?.close();
    this.eventSource = null;
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private async get<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Gateway request failed with HTTP ${response.status}`);
    }
    return response.json() as Promise<T>;
  }

  private openEventStream(listener: EventListener): void {
    if (this.stopped) {
      return;
    }
    this.eventSource?.close();
    const source = new EventSource(`${this.baseUrl}/api/v1/events`);
    this.eventSource = source;
    source.onopen = () => {
      this.retryCount = 0;
    };
    source.onmessage = (message) => {
      try {
        listener(JSON.parse(message.data) as GatewayCallEvent);
      } catch {
        // Ignore malformed events so a single bad frame cannot kill the stream.
      }
    };
    source.onerror = () => {
      source.close();
      if (this.stopped) {
        return;
      }
      const delay = Math.min(
        this.maxDelayMs,
        this.initialDelayMs * 2 ** Math.min(this.retryCount, 5),
      );
      this.retryCount += 1;
      this.reconnectTimer = window.setTimeout(() => this.openEventStream(listener), delay);
    };
  }
}

export const localGatewayClient = new GatewayClient({
  baseUrl: 'http://127.0.0.1:18730',
});
