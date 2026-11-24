import { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Activity, ExternalLink, RefreshCw, Settings, X } from 'lucide-react';
import { openMainWindow, quitApp } from '../../api/tauriCommands';
import { useGatewayStore } from '../../stores/useGatewayStore';
import { HubRoutingGraph } from './HubRoutingGraph';
import { LiveCallStream } from './LiveCallStream';

type TrayTab = 'agents' | 'instances' | 'skills' | 'routing';

export default function TrayApp() {
  const [tab, setTab] = useState<TrayTab>('routing');
  const { events, lifecycleState, startMockEvents } = useGatewayStore();

  useEffect(() => {
    const stopMockEvents = startMockEvents();
    let disposed = false;
    const unlistenPromise = getCurrentWindow().onFocusChanged(({ payload: focused }) => {
      if (!focused && !disposed) {
        void getCurrentWindow().hide();
      }
    });
    return () => {
      disposed = true;
      stopMockEvents();
      void unlistenPromise.then((unlisten) => unlisten());
    };
  }, [startMockEvents]);

  return (
    <div className="tray-window flex h-full w-full flex-col overflow-hidden text-[#ececef]" data-tauri-drag-region>
      <header className="flex items-center justify-between border-b border-[#222225] px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center border border-[#49494f] bg-[#1c1c20] text-[9px] font-semibold tracking-tight">D·M</div>
          <div>
            <div className="text-[12px] font-semibold tracking-wide">dcc-mcp</div>
            <div className="font-mono text-[9px] text-[#5c5c62]">LOCAL ROUTER</div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[#8e8e93]">
          <button type="button" className="rounded p-1.5 hover:bg-[#242428] hover:text-[#ececef]" title="刷新" onClick={() => window.location.reload()}>
            <RefreshCw size={14} />
          </button>
          <button type="button" className="rounded p-1.5 hover:bg-[#242428] hover:text-[#ececef]" title="设置" onClick={() => void openMainWindow('settings')}>
            <Settings size={14} />
          </button>
        </div>
      </header>

      <nav className="grid grid-cols-4 gap-1 border-b border-[#222225] p-2">
        {([
          ['agents', `Agent ${new Set(events.map((event) => event.agent.id)).size}`],
          ['instances', `实例 ${new Set(events.map((event) => event.target.instance_id)).size}`],
          ['skills', `技能 ${new Set(events.map((event) => event.skill_action)).size}`],
          ['routing', '路由'],
        ] as Array<[TrayTab, string]>).map(([value, label]) => (
          <button key={value} type="button" onClick={() => setTab(value)} className={`rounded px-1 py-1.5 text-[10px] transition-colors ${tab === value ? 'bg-[#e4e4e7] font-medium text-[#141415]' : 'text-[#8e8e93] hover:bg-[#202024] hover:text-[#ececef]'}`}>
            {label}
          </button>
        ))}
      </nav>

      <div className="flex items-center justify-between border-b border-[#222225] px-3 py-2 text-[10px]">
        <span className="flex items-center gap-1.5 text-[#8e8e93]"><Activity size={12} className="text-[#22c55e]" /> 今日 {events.length} 次调用 · CLI {events.filter((event) => event.ingress === 'cli').length} / MCP {events.filter((event) => event.ingress === 'mcp').length}</span>
        <button type="button" className="flex items-center gap-1 text-[#d4d4d8] hover:text-white" onClick={() => void openMainWindow('topology')}>打开路由 <ExternalLink size={11} /></button>
      </div>

      {tab === 'routing' ? <HubRoutingGraph state={lifecycleState} events={events} /> : <div className="flex h-[150px] items-center justify-center text-[11px] text-[#71717a]">{tab === 'agents' ? 'Agent 接入状态' : tab === 'instances' ? 'DCC 实例状态' : '已加载技能状态'}</div>}
      <LiveCallStream events={events} />

      <footer className="flex items-center justify-end gap-2 border-t border-[#222225] px-3 py-2">
        <button type="button" onClick={() => void openMainWindow()} className="rounded bg-[#e4e4e7] px-2.5 py-1.5 text-[10px] font-medium text-[#141415] hover:bg-white">打开主窗口</button>
        <button type="button" onClick={() => void quitApp()} className="flex items-center gap-1 rounded border border-[#35353b] px-2.5 py-1.5 text-[10px] text-[#a1a1aa] hover:border-[#55555d] hover:text-[#ececef]"><X size={11} /> 退出</button>
      </footer>
    </div>
  );
}
