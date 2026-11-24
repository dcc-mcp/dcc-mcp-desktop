import { useState } from 'react';

type MarketTab = 'plugins' | 'apps' | 'mcp' | 'skills' | 'market';

interface PluginsMarketViewProps {
  counts?: Partial<Record<MarketTab, number>>;
}

export default function PluginsMarketView({ counts = {} }: PluginsMarketViewProps) {
  const [tab, setTab] = useState<MarketTab>('plugins');
  const tabs: Array<[MarketTab, string]> = [['plugins', '插件'], ['apps', '应用'], ['mcp', 'MCP'], ['skills', '技能'], ['market', '市场']];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 border-b border-[#222225] pb-2">
        {tabs.map(([value, label]) => <button key={value} type="button" onClick={() => setTab(value)} className={`rounded px-3 py-1.5 text-[11px] ${tab === value ? 'bg-[#e4e4e7] text-[#141415]' : 'text-[#8e8e93] hover:bg-[#202024]'}`}>{label} {counts[value] ?? ''}</button>)}
      </div>
      <div className="border border-[#222225] bg-[#1a1a1d] p-4 text-[12px] text-[#8e8e93]">{tab === 'market' ? 'marketplace.json 源管理' : `${tabs.find(([value]) => value === tab)?.[1]}清单`}</div>
    </div>
  );
}
