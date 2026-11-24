import { Settings } from 'lucide-react';

export interface SidebarItem {
  id: string;
  label: string;
  group: string;
}

interface SidebarProps {
  items: SidebarItem[];
  activeId: string;
  gatewayAddress: string;
  onSelect: (id: string) => void;
  onSettings: () => void;
}

export default function Sidebar({ items, activeId, gatewayAddress, onSelect, onSettings }: SidebarProps) {
  const groups = [...new Set(items.map((item) => item.group))];
  return (
    <aside className="flex w-[220px] shrink-0 flex-col border-r border-[#222225] bg-[#111112] p-3">
      <div className="mb-5 flex items-center gap-2 px-2 py-1">
        <div className="flex h-6 w-6 items-center justify-center border border-[#45454b] text-[9px] font-semibold">D·M</div>
        <span className="text-[13px] font-semibold tracking-wide">dcc-mcp</span>
      </div>
      <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto">
        {groups.map((group) => (
          <div key={group}>
            <div className="px-2 pb-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-[#5c5c62]">{group}</div>
            {items.filter((item) => item.group === group).map((item) => (
              <button key={item.id} type="button" onClick={() => onSelect(item.id)} className={`mb-0.5 flex w-full items-center px-2 py-2 text-left text-[12px] ${activeId === item.id ? 'bg-[#222225] text-[#ececef]' : 'text-[#8e8e93] hover:bg-[#1a1a1d] hover:text-[#ececef]'}`}>
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="border-t border-[#222225] pt-3">
        <button type="button" onClick={onSettings} className="mb-3 flex w-full items-center gap-2 px-2 py-2 text-left text-[12px] text-[#8e8e93] hover:text-[#ececef]"><Settings size={13} /> 设置</button>
        <div className="flex items-center gap-2 px-2 font-mono text-[10px] text-[#8e8e93]"><span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" /> 网关 {gatewayAddress}</div>
      </div>
    </aside>
  );
}
