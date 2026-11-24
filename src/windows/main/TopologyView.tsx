import type { GatewayCallEvent, LifecycleState } from '../../types/gateway';
import { HubRoutingGraph } from '../tray/HubRoutingGraph';

interface TopologyViewProps {
  events: GatewayCallEvent[];
  state: LifecycleState;
}

export default function TopologyView({ events, state }: TopologyViewProps) {
  return <section className="border border-[#222225] bg-[#1a1a1d] p-3"><HubRoutingGraph state={state} events={events} /></section>;
}
