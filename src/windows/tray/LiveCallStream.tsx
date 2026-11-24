import type { GatewayCallEvent } from '../../types/gateway';

interface LiveCallStreamProps {
  events: GatewayCallEvent[];
}

function statusLabel(event: GatewayCallEvent): string {
  if (event.status === 'running') return '正在执行...';
  if (event.status === 'failed') return event.error?.code ?? '执行失败';
  if (event.status === 'completed') return `${((event.duration_ms ?? 0) / 1000).toFixed(1)}s · ${event.retry_count ?? 1} 次尝试`;
  return '已连接';
}

export function LiveCallStream({ events }: LiveCallStreamProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
      <div className="space-y-1">
        {events.slice(0, 8).map((event) => (
          <div key={event.trace_id} className="border-b border-[#222225] py-2 last:border-b-0">
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${event.status === 'failed' ? 'bg-[#ef4444]' : event.status === 'running' ? 'bg-[#3b82f6]' : 'bg-[#22c55e]'}`} />
                <span className="truncate font-medium text-[#e4e4e7]">{event.agent.display_name}</span>
                <span className="shrink-0 rounded bg-[#202024] px-1.5 py-0.5 font-mono text-[10px] text-[#a1a1aa]">
                  {event.ingress} · {event.skill_action}
                </span>
              </div>
              <span className="shrink-0 font-mono text-[10px] text-[#5c5c62]">
                {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="mt-1 truncate pl-3 font-mono text-[10px] text-[#8e8e93]">
              → {event.target.dcc_app} · {statusLabel(event)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
