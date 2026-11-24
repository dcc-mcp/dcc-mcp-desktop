import type { DccInstance, GatewayCallRecord } from '../types/gateway';

export interface GatewayClientOptions {
  baseUrl: string;
}

export type EventListener = (event: Record<string, unknown>) => void;

export class GatewayClient {
  private readonly baseUrl: string;
  private eventSource: EventSource | null = null;
  private stopped = false;

  constructor(options: GatewayClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
  }

  async getHealth(): Promise<Record<string, unknown>> {
    try {
      return await this.get<Record<string, unknown>>('/health');
    } catch (error) {
      if (error instanceof Error && error.message.includes('HTTP 404')) {
        return this.get<Record<string, unknown>>('/admin/api/health');
      }
      throw error;
    }
  }

  async getInstances(): Promise<DccInstance[]> {
    let payload: { instances?: DccInstance[] } | DccInstance[];
    try {
      payload = await this.get<{ instances?: DccInstance[] } | DccInstance[]>('/instances');
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes('HTTP 404')) {
        throw error;
      }
      payload = await this.get<{ instances?: DccInstance[] } | DccInstance[]>(
        '/admin/api/instances',
      );
    }
    return Array.isArray(payload) ? payload : (payload.instances ?? []);
  }

  async getCalls(limit = 200): Promise<GatewayCallRecord[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    const payload = await this.get<{ calls?: GatewayCallRecord[] } | GatewayCallRecord[]>(
      `/admin/api/calls?${params.toString()}`,
    );
    return Array.isArray(payload) ? payload : (payload.calls ?? []);
  }

  subscribe(listener: EventListener): () => void {
    this.stopped = false;
    this.eventSource?.close();
    const source = new EventSource(`${this.baseUrl}/admin/api/events`);
    this.eventSource = null;
    source.onmessage = (message) => {
      try {
        const parsed = JSON.parse(message.data) as { data?: Record<string, unknown> };
        listener(parsed.data ?? parsed);
      } catch {
        // Ignore malformed frames so a single bad event cannot kill the stream.
      }
    };
    return () => this.stop();
  }

  stop(): void {
    this.stopped = true;
    this.eventSource?.close();
    this.eventSource = null;
  }

  private async get<T>(path: string): Promise<T> {
    if (this.stopped) {
      throw new Error('Gateway client is stopped');
    }
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Gateway request failed with HTTP ${response.status}`);
    }
    return response.json() as Promise<T>;
  }
}

export const localGatewayClient = new GatewayClient({
  baseUrl: 'http://127.0.0.1:9765',
});
