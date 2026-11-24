import type { DetectedAgent } from '../../types/agent';

interface AgentsViewProps {
  agents: DetectedAgent[];
  onProvision: (agent: DetectedAgent) => void;
}

export default function AgentsView({ agents, onProvision }: AgentsViewProps) {
  return (
    <section className="space-y-2">
      {agents.map((agent) => (
        <button key={agent.id} type="button" onClick={() => onProvision(agent)} className="flex w-full items-center justify-between border-b border-[#222225] px-1 py-3 text-left hover:bg-[#1a1a1d]">
          <span><span className="block text-[13px] text-[#ececef]">{agent.display_name}</span><span className="font-mono text-[10px] text-[#5c5c62]">{agent.version}</span></span>
          <span className="font-mono text-[10px] text-[#8e8e93]">{agent.connected ? '已接入' : '未接入'}</span>
        </button>
      ))}
    </section>
  );
}
