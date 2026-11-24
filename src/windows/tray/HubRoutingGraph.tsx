import type { GatewayCallEvent, LifecycleState } from '../../types/gateway';

interface HubRoutingGraphProps {
  state: LifecycleState;
  events: GatewayCallEvent[];
}

function stateColor(state: LifecycleState): string {
  if (state === 'running') return '#3b82f6';
  if (state === 'failed') return '#ef4444';
  if (state === 'completed') return '#a1a1aa';
  return '#3f3f46';
}

export function HubRoutingGraph({ state, events }: HubRoutingGraphProps) {
  const active = events.slice(0, 2);
  const color = stateColor(state);
  return (
    <div className="relative h-[150px] overflow-hidden border-y border-[#232327] bg-[#151517]">
      <svg viewBox="0 0 380 150" className="absolute inset-0 h-full w-full" aria-label="Gateway routing graph">
        <path d="M70 35 C115 35 135 64 164 72" fill="none" stroke={active[0] ? color : '#303036'} strokeWidth="1.5" strokeDasharray={state === 'running' ? '4 5' : undefined} className={state === 'running' ? 'dcc-route-flow' : undefined} />
        <path d="M70 115 C116 115 136 86 164 78" fill="none" stroke={active[1] ? '#3f3f46' : '#303036'} strokeWidth="1.5" />
        <path d="M216 72 C248 64 266 35 310 35" fill="none" stroke={color} strokeWidth="1.5" strokeDasharray={state === 'running' ? '4 5' : undefined} className={state === 'running' ? 'dcc-route-flow' : undefined} />
        <path d="M216 78 C249 86 268 115 310 115" fill="none" stroke={state === 'failed' ? '#ef4444' : '#303036'} strokeWidth="1.5" />
        <circle cx="190" cy="75" r="28" fill="#1b1b1f" stroke="#44444b" />
        <circle cx="190" cy="75" r="22" fill="#141415" stroke={color} strokeWidth="1.5" />
        <text x="190" y="72" fill="#f4f4f5" fontSize="9" textAnchor="middle" fontFamily="IBM Plex Mono">DCCMCP</text>
        <text x="190" y="84" fill="#71717a" fontSize="7" textAnchor="middle" fontFamily="IBM Plex Mono">GATEWAY</text>
      </svg>
      <div className="absolute left-3 top-3 flex items-center gap-2 rounded border border-[#2b2b30] bg-[#1a1a1d] px-2 py-1 text-[11px] text-[#e4e4e7]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
        {active[0]?.agent.display_name ?? 'Codex'}
      </div>
      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded border border-[#2b2b30] bg-[#1a1a1d] px-2 py-1 text-[11px] text-[#e4e4e7]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
        {active[1]?.agent.display_name ?? 'Claude Code'}
      </div>
      <div className="absolute right-3 top-3 flex items-center gap-2 rounded border border-[#2b2b30] bg-[#1a1a1d] px-2 py-1 text-[11px] text-[#e4e4e7]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
        Blender 4.2
      </div>
      <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded border border-[#2b2b30] bg-[#1a1a1d] px-2 py-1 text-[11px] text-[#e4e4e7]">
        <span className={`h-1.5 w-1.5 rounded-full ${state === 'failed' ? 'bg-[#ef4444]' : 'bg-[#22c55e]'}`} />
        Maya 2025
      </div>
    </div>
  );
}
