import type { GatewayCallEvent } from '../../types/gateway';

interface ObservabilityViewProps {
  events: GatewayCallEvent[];
}

export default function ObservabilityView({ events }: ObservabilityViewProps) {
  return (
    <section className="space-y-1">
      {events.map((event) => <div key={event.trace_id} className="flex items-center justify-between border-b border-[#222225] py-2 font-mono text-[11px]"><span className="text-[#d4d4d8]">{event.trace_id}</span><span className="text-[#8e8e93]">{event.status} · {event.skill_action}</span></div>)}
    </section>
  );
}
