import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  AlertCircle,
  AppWindow,
  ArrowUpRight,
  Box,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Code2,
  Copy,
  Cpu,
  Download,
  ExternalLink,
  FileCode2,
  FolderOpen,
  GitBranch,
  Layers,
  Layout,
  Maximize2,
  Minimize2,
  Minus,
  Monitor,
  Network,
  Package,
  PanelBottom,
  Play,
  Plus,
  Puzzle,
  RefreshCw,
  RotateCcw,
  Search,
  Server,
  Settings,
  SlidersHorizontal,
  Square,
  Terminal,
  Trash2,
  Volume2,
  Waypoints,
  Wifi,
  Wrench,
  X,
} from 'lucide-react';

// ============================================================================
// 1. 核心数据集：CLI + MCP 双通道 Agent / 原生协议 DCC 实例 / 五维插件与市场
// ============================================================================

const INITIAL_AGENTS = [
  {
    id: 'codex',
    name: 'Codex',
    version: 'CLI 0.117.0',
    updateTo: '0.118.2',
    connected: true,
    mark: 'CX',
    markBg: '#1f2430',
    markColor: '#93c5fd',
    ingressMode: 'CLI + Skills (推荐)',
    ingressShort: 'CLI',
    scopeProfile: '全部已启用插件 (10)',
    configPath: '~/.codex/skills/dcc-mcp/SKILL.md',
    shimBinary: '~/.local/bin/dccmcp (ENV: DCCMCP_CLIENT=codex)',
    callsToday: 184,
    descConnected: '已注入 CLI Shim 与按需 SKILL.md · 父进程嗅探已就绪',
    descUnconnected: '未接入 · 使用 Codex CLI 默认本地环境',
  },
  {
    id: 'claude-code',
    name: 'Claude Code',
    version: '2.1.33',
    updateTo: '2.1.35',
    connected: true,
    mark: 'CC',
    markBg: '#261e1b',
    markColor: '#e08b6b',
    ingressMode: 'CLI + Skills (推荐)',
    ingressShort: 'CLI',
    scopeProfile: '全部已启用插件 (10)',
    configPath: '~/.claude/plugins/dcc-mcp/.claude-plugin/plugin.json',
    shimBinary: '~/.local/bin/dccmcp (ENV: DCCMCP_CLIENT=claude-code)',
    callsToday: 142,
    descConnected: '已挂载本地插件包与 CLI 转发器 · 零上下文膨胀',
    descUnconnected: '未接入 · 使用 Claude Code 默认工具链',
  },
  {
    id: 'dcc-agent-sdk',
    name: 'dcc-agent-sdk',
    version: '0.9.4',
    updateTo: null,
    connected: true,
    mark: 'SD',
    markBg: '#1f2024',
    markColor: '#d4d4d8',
    ingressMode: 'CLI + MCP 双通道',
    ingressShort: 'SDK',
    scopeProfile: '仅 Blender + CUA',
    configPath: './pyproject.toml -> dcc-mcp-core==0.9.4',
    shimBinary: 'unix:///tmp/dccmcp.sock (Direct IPC)',
    callsToday: 60,
    descConnected: '通过本地 IPC Socket 直连 DCCMCP Server · 支持批量管线脚本',
    descUnconnected: '未接入 · SDK 处于离线沙箱模式',
  },
  {
    id: 'cursor',
    name: 'Cursor',
    version: '1.14.2',
    updateTo: null,
    connected: true,
    mark: 'CU',
    markBg: '#202024',
    markColor: '#e4e4e7',
    ingressMode: 'MCP Bridge (元工具)',
    ingressShort: 'MCP',
    scopeProfile: '只读场景检视',
    configPath: '~/.cursor/mcp.json -> mcpServers.dccmcp',
    shimBinary: 'dccmcp mcp-shim --meta-only (仅暴露 3 个元工具)',
    callsToday: 32,
    descConnected: '通过精简 MCP 元工具桥接入 · 按需拉取子命令 Schema',
    descUnconnected: '未接入 · 未写入 .cursor/mcp.json',
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    version: '2.4.1',
    updateTo: '2.4.3',
    connected: true,
    mark: 'OC',
    markBg: '#1e2022',
    markColor: '#a1a1aa',
    ingressMode: 'CLI + Skills (推荐)',
    ingressShort: 'CLI',
    scopeProfile: '全部已启用插件 (10)',
    configPath: '~/.config/opencode/skills/dcc-mcp/SKILL.md',
    shimBinary: '~/.local/bin/dccmcp (PID Sniffing)',
    callsToday: 0,
    descConnected: '已注入 CLI 转发器与技能索引 · 待命',
    descUnconnected: '未接入 · 使用 OpenCode 自有配置',
  },
  {
    id: 'gemini-cli',
    name: 'Gemini CLI',
    version: '0.33.0',
    updateTo: null,
    connected: true,
    mark: 'GM',
    markBg: '#1d222b',
    markColor: '#93c5fd',
    ingressMode: 'CLI + Skills (推荐)',
    ingressShort: 'CLI',
    scopeProfile: '仅 Blender + CUA',
    configPath: '~/.gemini/skills/dcc-mcp/SKILL.md',
    shimBinary: '~/.local/bin/dccmcp',
    callsToday: 0,
    descConnected: '已注入 CLI 技能目录 · 支持多窗口指定实例调用',
    descUnconnected: '未接入 · 使用 Gemini CLI 默认配置',
  },
  // 未接入 Agents
  {
    id: 'claude-desktop',
    name: 'Claude Desktop',
    version: '1.7.0',
    updateTo: null,
    connected: false,
    mark: 'CD',
    markBg: '#221d1b',
    markColor: '#d97757',
    ingressMode: 'MCP Bridge (元工具)',
    ingressShort: 'MCP',
    scopeProfile: '只读场景检视',
    configPath: '~/Library/Application Support/Claude/claude_desktop_config.json',
    shimBinary: 'dccmcp mcp-shim --stdio',
    callsToday: 0,
    descConnected: '已向 claude_desktop_config.json 写入单入口元工具桥',
    descUnconnected: '未接入 · 开启后自动写入 MCP 元工具桥，关闭即恢复原配置',
  },
  {
    id: 'kimi-code',
    name: 'Kimi Code',
    version: '1.5.0',
    updateTo: null,
    connected: false,
    mark: 'KM',
    markBg: '#1d2228',
    markColor: '#7dd3fc',
    ingressMode: 'CLI + Skills (推荐)',
    ingressShort: 'CLI',
    scopeProfile: '全部已启用插件 (10)',
    configPath: '~/.kimi/skills/dcc-mcp/SKILL.md',
    shimBinary: '~/.local/bin/dccmcp',
    callsToday: 0,
    descConnected: '已注入 CLI 转发器与 SKILL.md',
    descUnconnected: '未接入 · 使用 Kimi Code 默认设置',
  },
  {
    id: 'windsurf',
    name: 'Windsurf',
    version: '1.19.1',
    updateTo: null,
    connected: false,
    mark: 'WS',
    markBg: '#1f1f23',
    markColor: '#a1a1aa',
    ingressMode: 'CLI + MCP 双通道',
    ingressShort: 'MCP',
    scopeProfile: '全部已启用插件 (10)',
    configPath: '~/.codeium/windsurf/mcp_config.json',
    shimBinary: 'dccmcp mcp-shim',
    callsToday: 0,
    descConnected: '已同步 CLI 与 MCP 双入口配置',
    descUnconnected: '未接入 · 使用 Windsurf 自有配置',
  },
];

const INITIAL_DCC_INSTANCES = [
  {
    id: 'blender-01',
    shortTitle: 'Blender 4.2',
    windowTag: 'Blender #1',
    scene: 'char_rig.blend',
    protocol: 'Python Socket',
    endpoint: '127.0.0.1:51231',
    pid: 48210,
    lockedBy: 'Codex (CLI)',
    bridgePkg: 'dcc-mcp-blender v1.4.2',
    path: '/Projects/Aether/assets/char_rig.blend',
    baseHealthy: true,
  },
  {
    id: 'maya-01',
    shortTitle: 'Maya 2025',
    windowTag: 'Maya #1',
    scene: 'lookdev.mb',
    protocol: 'CommandPort RPC',
    endpoint: '127.0.0.1:51238',
    pid: 50112,
    lockedBy: null,
    bridgePkg: 'dcc-mcp-maya v1.1.8',
    path: '/Projects/Aether/shots/lookdev.mb',
    baseHealthy: true,
  },
  {
    id: 'zbrush-cua',
    shortTitle: 'dcc-cua · ZBrush',
    windowTag: 'ZBrush 2026',
    scene: 'armor_high.zpr',
    protocol: 'CUA 桌面窗口控制',
    endpoint: 'Win32/HWND 0x00140A',
    pid: 51890,
    lockedBy: null,
    bridgePkg: 'dcc-cua v0.8.6 (免插件)',
    path: '/Projects/Aether/sculpt/armor_high.zpr',
    baseHealthy: true,
  },
  {
    id: 'ue-01',
    shortTitle: 'Unreal 5.4',
    windowTag: 'UE5 #1',
    scene: 'Level_01.umap',
    protocol: 'Editor WebSocket',
    endpoint: 'ws://127.0.0.1:51249',
    pid: 53904,
    lockedBy: null,
    bridgePkg: 'dcc-mcp-unreal v0.9.1',
    path: '/Projects/Aether/UE5/Content/Maps/Level_01.umap',
    baseHealthy: true,
  },
];

// 对齐截图 2 & 3：插件 10 | 应用 16 | MCP 4 | 技能 144 | 市场 2
const INITIAL_ECOSYSTEM_ITEMS = [
  // 插件 (Plugins)
  {
    id: 'plg-dcc-cua',
    tab: 'plugins',
    name: 'dcc-cua',
    subSlug: 'dcc-cua',
    desc: 'Automate multi-window CUA tasks for closed-source or plugin-free DCC software',
    badge: 'CUA 窗口级',
    cliPrefix: 'dccmcp exec cua',
    enabled: true,
    mark: 'CU',
    markBg: '#2b2118',
    markColor: '#fb923c',
  },
  {
    id: 'plg-blender',
    tab: 'plugins',
    name: 'dcc-mcp-blender',
    subSlug: 'loonghao/dcc-mcp-blender',
    desc: 'Blender Python Socket bridge, multi-window PID router, PBR baker & GLB exporter',
    badge: 'Python Socket',
    cliPrefix: 'dccmcp exec blender',
    enabled: true,
    mark: 'BL',
    markBg: '#272019',
    markColor: '#f59e0b',
  },
  {
    id: 'plg-meshy',
    tab: 'plugins',
    name: 'meshy-dcc-bridge',
    subSlug: 'meshy-dcc',
    desc: 'Generate 3D meshes, retopologize, and import textures directly into active DCC scenes',
    badge: 'REST + Socket',
    cliPrefix: 'dccmcp exec meshy',
    enabled: true,
    mark: 'MS',
    markBg: '#1c2520',
    markColor: '#4ade80',
  },
  {
    id: 'plg-maya',
    tab: 'plugins',
    name: 'dcc-mcp-maya',
    subSlug: 'loonghao/dcc-mcp-maya',
    desc: 'Maya CommandPort RPC connector for skeleton validation, skin weights, and FBX publishing',
    badge: 'CommandPort RPC',
    cliPrefix: 'dccmcp exec maya',
    enabled: true,
    mark: 'MY',
    markBg: '#192326',
    markColor: '#38bdf8',
  },
  {
    id: 'plg-nuke',
    tab: 'plugins',
    name: 'nuke-compositor',
    subSlug: 'dcc-mcp/nuke',
    desc: 'Automate NukeX node graphs, AOV EXR channel assembly, and Write node farm submission',
    badge: 'Nuke Python IPC',
    cliPrefix: 'dccmcp exec nuke',
    enabled: true,
    mark: 'NK',
    markBg: '#252218',
    markColor: '#facc15',
  },
  {
    id: 'plg-houdini',
    tab: 'plugins',
    name: 'houdini-hda-runner',
    subSlug: 'dcc-mcp/houdini',
    desc: 'Drive Hython / hrpyc procedural HDA parameters, PDG TOPs cooking, and USD Solaris stages',
    badge: 'hrpyc Socket',
    cliPrefix: 'dccmcp exec houdini',
    enabled: true,
    mark: 'HD',
    markBg: '#261c19',
    markColor: '#fb7185',
  },
  {
    id: 'plg-unreal',
    tab: 'plugins',
    name: 'unreal-remote-control',
    subSlug: 'dcc-mcp/unreal',
    desc: 'Bridge Unreal Engine 5.4+ Editor WebSocket API, PCG graph updates, and Sequencer renders',
    badge: 'Editor WebSocket',
    cliPrefix: 'dccmcp exec unreal',
    enabled: true,
    mark: 'UE',
    markBg: '#1f1f23',
    markColor: '#e4e4e7',
  },
  {
    id: 'plg-zbrush',
    tab: 'plugins',
    name: 'zbrush-goz-ipc',
    subSlug: 'dcc-mcp/zbrush',
    desc: 'Trigger ZScript routines, ZRemesher decimation, and GoZ mesh transfers via CUA + WatchFolder',
    badge: 'ZScript + CUA',
    cliPrefix: 'dccmcp exec zbrush',
    enabled: true,
    mark: 'ZB',
    markBg: '#212126',
    markColor: '#a1a1aa',
  },
  {
    id: 'plg-c4d',
    tab: 'plugins',
    name: 'cinema4d-mograph',
    subSlug: 'dcc-mcp/c4d',
    desc: 'Control Cinema 4D MoGraph cloners, Redshift materials, and Alembic scene exports',
    badge: 'TCP Bridge',
    cliPrefix: 'dccmcp exec c4d',
    enabled: false,
    mark: 'C4',
    markBg: '#1c1f29',
    markColor: '#818cf8',
  },
  {
    id: 'plg-lod-guard',
    tab: 'plugins',
    name: 'pipeline-lod-guard',
    subSlug: 'studio/lod-guard',
    desc: 'Enforce triangle budgets, UV overlap thresholds, and naming conventions prior to export',
    badge: 'CLI Hook',
    cliPrefix: 'dccmcp exec guard',
    enabled: true,
    mark: 'LG',
    markBg: '#1d2420',
    markColor: '#86efac',
  },
  // 应用连接器 (Apps)
  {
    id: 'app-blender',
    tab: 'apps',
    name: 'Blender 4.2 / 4.3',
    subSlug: 'Startup Script 已安装',
    desc: '通过 addons/dcc_mcp_bridge 自动监听独立窗口 Socket，支持后台 Headless 与前台视口双模式',
    badge: '已就绪 · 2 实例',
    cliPrefix: 'Python Socket :51231',
    enabled: true,
    mark: 'B',
    markBg: '#272019',
    markColor: '#f59e0b',
  },
  {
    id: 'app-maya',
    tab: 'apps',
    name: 'Autodesk Maya 2025',
    subSlug: 'userSetup.py 已注入',
    desc: '通过 Maya CommandPort 与主线程 executeDeferred 安全执行 MEL / Python API 调用',
    badge: '已就绪 · 1 实例',
    cliPrefix: 'CommandPort :51238',
    enabled: true,
    mark: 'M',
    markBg: '#192326',
    markColor: '#38bdf8',
  },
  {
    id: 'app-zbrush',
    tab: 'apps',
    name: 'Maxon ZBrush 2026',
    subSlug: 'CUA 精确窗口绑定',
    desc: '无需侵入式 SDK，通过 dcc-cua 锁定指定 HWND 窗口句柄安全完成高模减面与导出任务',
    badge: 'CUA 托管中',
    cliPrefix: 'HWND 0x00140A',
    enabled: true,
    mark: 'Z',
    markBg: '#222226',
    markColor: '#d4d4d8',
  },
  {
    id: 'app-ue5',
    tab: 'apps',
    name: 'Unreal Engine 5.4',
    subSlug: 'RemoteControl WebSocket',
    desc: '工程级插件连接器，绑定 uproject 路径防止跨工程资产误写',
    badge: 'WebSocket :51249',
    cliPrefix: 'ws://127.0.0.1:51249',
    enabled: true,
    mark: 'U',
    markBg: '#1f1f24',
    markColor: '#e4e4e7',
  },
  // MCP 桥接项 (MCP)
  {
    id: 'mcp-meta',
    tab: 'mcp',
    name: 'dccmcp-meta-bridge',
    subSlug: 'stdio / sse 单入口元服务',
    desc: '仅向不支持 CLI 的纯 MCP 客户端暴露 list_instances / inspect_skill / invoke_action 3 个元工具',
    badge: '核心内置',
    cliPrefix: 'dccmcp mcp-shim',
    enabled: true,
    mark: 'MC',
    markBg: '#1e2229',
    markColor: '#93c5fd',
  },
  {
    id: 'mcp-asset-lib',
    tab: 'mcp',
    name: 'studio-usd-catalog-mcp',
    subSlug: 'http://10.0.4.12:8090/mcp',
    desc: '团队共享 USD / PBR 材质资产库只读检索 MCP 服务，由本地网关统一代理鉴权',
    badge: 'Remote SSE',
    cliPrefix: 'mcp · usd-catalog',
    enabled: true,
    mark: 'US',
    markBg: '#1f2321',
    markColor: '#6ee7b7',
  },
  // 技能 (Skills - 代表 144 个按需 CLI 子技能)
  {
    id: 'sk-bake',
    tab: 'skills',
    name: 'blender/bake_pbr',
    subSlug: 'SKILL.md · ~260 tok',
    desc: '自动拆分非重叠 UV 并调用 Cycles 烘焙 BaseColor / Roughness / Normal 贴图至指定输出目录',
    badge: 'CLI Skill',
    cliPrefix: 'dccmcp exec blender bake_pbr',
    enabled: true,
    mark: 'SK',
    markBg: '#202025',
    markColor: '#d4d4d8',
  },
  {
    id: 'sk-cua-window',
    tab: 'skills',
    name: 'cua/exact_window_action',
    subSlug: 'SKILL.md · ~310 tok',
    desc: '基于窗口句柄快照与 UI 树坐标在无 API 软件中执行确定性点击、热键与导出对话框填写',
    badge: 'CUA Skill',
    cliPrefix: 'dccmcp exec cua run',
    enabled: true,
    mark: 'SK',
    markBg: '#202025',
    markColor: '#d4d4d8',
  },
  {
    id: 'sk-rig-check',
    tab: 'skills',
    name: 'maya/validate_skeleton',
    subSlug: 'SKILL.md · ~190 tok',
    desc: '检查关节零旋转冻结、命名对称性与最大骨骼影响数（<=4），输出 JSON 诊断报告',
    badge: 'CLI Skill',
    cliPrefix: 'dccmcp exec maya validate_skeleton',
    enabled: true,
    mark: 'SK',
    markBg: '#202025',
    markColor: '#d4d4d8',
  },
  {
    id: 'sk-nuke-aov',
    tab: 'skills',
    name: 'nuke/assemble_aov',
    subSlug: 'SKILL.md · ~240 tok',
    desc: '扫描渲染序列目录并自动构建 Beauty / Specular / Cryptomatte 合成节点树',
    badge: 'CLI Skill',
    cliPrefix: 'dccmcp exec nuke assemble_aov',
    enabled: true,
    mark: 'SK',
    markBg: '#202025',
    markColor: '#d4d4d8',
  },
];

// 1:1 对应截图 3 的本地/远程 marketplace.json 源
const INITIAL_MARKETPLACES = [
  {
    id: 'mkt-dcc-cua',
    name: 'DCC-CUA',
    countText: '4 个插件 · 38 项技能',
    path: 'C:\\Users\\loonghao\\.codex\\.tmp\\marketplaces\\dcc-cua\\.claude-plugin\\marketplace.json',
    hasUpgrade: true,
  },
  {
    id: 'mkt-dcc-core',
    name: 'DCC-MCP-OFFICIAL',
    countText: '6 个插件 · 106 项技能',
    path: 'https://registry.dcc-mcp.dev/v1/marketplace.json (本地缓存已同步)',
    hasUpgrade: false,
  },
];

const INITIAL_ARTIFACTS = [
  {
    id: 'art-101',
    name: 'char_rig_baked_2k.glb',
    spec: 'GLB · 24,800 Tris · 2K PBR',
    size: '19.4 MB',
    time: '15:49:29',
    status: 'completed',
    agent: 'Codex',
    ingress: 'CLI',
    cliCmd: 'dccmcp exec blender bake_pbr --instance blender-01 --res 2048 --export char_rig_baked_2k.glb',
    targetDcc: 'Blender 4.2 · char_rig.blend',
    protocol: 'Python Socket (:51231)',
    traceId: 'tr_8841c09',
  },
  {
    id: 'art-102',
    name: 'armor_lowpoly_decimated.obj',
    spec: 'OBJ · 15,000 Quads · CUA 导出',
    size: '8.7 MB',
    time: '15:49:20',
    status: 'completed',
    agent: 'dcc-agent-sdk',
    ingress: 'SDK/CLI',
    cliCmd: 'dccmcp exec cua zremesh_export --hwnd 0x00140A --target-polys 15000',
    targetDcc: 'dcc-cua · ZBrush 2026',
    protocol: 'CUA Win32 HWND',
    traceId: 'tr_8841b72',
  },
  {
    id: 'art-103',
    name: 'lookdev_turntable_001.exr',
    spec: 'OpenEXR · ACEScg · 1920×1080',
    size: '42.1 MB',
    time: '15:48:52',
    status: 'completed',
    agent: 'Claude Code',
    ingress: 'CLI',
    cliCmd: 'dccmcp exec maya render_frame --instance maya-01 --cam persp1 --layer beauty',
    targetDcc: 'Maya 2025 · lookdev.mb',
    protocol: 'CommandPort RPC (:51238)',
    traceId: 'tr_8840f18',
  },
];

// ============================================================================
// 2. 极简原子 UI 组件 (Magpie 原生开关 / 徽标 / 工程视口线框)
// ============================================================================

function MagpieToggle({ checked, onChange, disabled = false, size = 'md' }) {
  const dims = size === 'sm' ? 'h-[18px] w-[32px]' : 'h-[20px] w-[36px]';
  const thumbDims = size === 'sm' ? 'h-[12px] w-[12px]' : 'h-[14px] w-[14px]';
  const translateOn = size === 'sm' ? 'translate-x-[15px]' : 'translate-x-[17px]';

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled && onChange) onChange();
      }}
      className={`relative inline-flex ${dims} shrink-0 items-center rounded-full border transition-colors duration-150 ${
        disabled
          ? 'opacity-40 cursor-not-allowed bg-[#1c1c1f] border-[#2a2a2f]'
          : checked
          ? 'cursor-pointer bg-[#f4f4f5] border-[#f4f4f5]'
          : 'cursor-pointer bg-[#27272a] border-[#36363c] hover:border-[#4b4b53]'
      }`}
    >
      <span
        className={`inline-block ${thumbDims} transform rounded-full transition-transform duration-150 ${
          checked ? `${translateOn} bg-[#141416]` : 'translate-x-[2px] bg-[#a1a1aa]'
        }`}
      />
    </button>
  );
}

// 极简飞鸟/节点几何标识 (致敬 Magpie 顶栏小图标但代表 dcc-mcp 汇聚网关)
function DccMcpGlyph({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className="shrink-0">
      <path
        d="M3.5 6L9 10L3.5 14V6Z"
        fill="#f4f4f5"
      />
      <path
        d="M9.5 10L16.5 5.5L14.2 11.2L16.5 14.5L9.5 10Z"
        stroke="#f4f4f5"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatusDot({ state = 'connected' }) {
  const cls =
    state === 'running'
      ? 'bg-[#3b82f6]'
      : state === 'failed'
      ? 'bg-[#ef4444]'
      : state === 'completed' || state === 'connected'
      ? 'bg-[#22c55e]'
      : 'bg-[#71717a]';
  return <span className={`inline-block w-[7px] h-[7px] rounded-full shrink-0 ${cls}`} />;
}

// 中心圆环贝塞尔汇聚路由图 (同时用于托盘小窗口与主窗口路由页，1:1 复刻 Magpie 曲线拓扑)
function CircularHubRoutingGraph({ lifecycleState, compact = false, onSelectNode }) {
  // SVG 坐标系：346 x 154 (紧凑托盘尺寸) 或 760 x 230 (主窗口展开尺寸)
  const isRunning = lifecycleState === 'running';
  const isFailed = lifecycleState === 'failed';
  const isCompleted = lifecycleState === 'completed';

  if (compact) {
    return (
      <div className="relative w-full h-[156px] bg-[#1c1c20] border border-[#28282d] rounded-[12px] overflow-hidden select-none">
        {/* 底层贝塞尔曲线 SVG */}
        <svg viewBox="0 0 350 156" className="absolute inset-0 w-full h-full pointer-events-none">
          {/* 左侧 3 个 Agent 到中心圆环 (cx=175, cy=78, r=21) */}
          <path
            d="M 134 36 C 150 36, 146 72, 154 76"
            fill="none"
            stroke={isRunning ? '#3b82f6' : '#34343c'}
            strokeWidth={isRunning ? '1.6' : '1.2'}
          />
          <path
            d="M 134 78 L 154 78"
            fill="none"
            stroke="#34343c"
            strokeWidth="1.2"
          />
          <path
            d="M 134 120 C 150 120, 146 84, 154 80"
            fill="none"
            stroke={isFailed ? '#ef4444' : '#34343c'}
            strokeWidth={isFailed ? '1.5' : '1.2'}
          />

          {/* 中心圆环到右侧 3 个目标 DCC 实例 */}
          {/* 顶部目标: Blender 4.2 */}
          <path
            d="M 196 75 C 208 75, 206 42, 220 42"
            fill="none"
            stroke={isRunning ? '#3b82f6' : isCompleted ? '#22c55e' : '#34343c'}
            strokeWidth={isRunning || isCompleted ? '1.7' : '1.2'}
          />
          {isRunning && (
            <circle cx="209" cy="56" r="3.5" fill="#3b82f6" stroke="#1c1c20" strokeWidth="1.2" />
          )}

          {/* 中部目标: dcc-cua · ZBrush */}
          <path
            d="M 196 78 L 220 78"
            fill="none"
            stroke="#34343c"
            strokeWidth="1.2"
          />

          {/* 底部目标: Unreal 5.4 (Failed 时复刻 × 红色异常连线) */}
          <path
            d="M 196 81 C 208 81, 206 114, 220 114"
            fill="none"
            stroke={isFailed ? '#ef4444' : '#3b82f6'}
            strokeWidth="1.4"
            strokeOpacity={isFailed ? '1' : '0.45'}
          />
          {isFailed && (
            <circle cx="209" cy="99" r="3.5" fill="#ef4444" stroke="#1c1c20" strokeWidth="1.2" />
          )}
        </svg>

        {/* 左列：调用方 Agent 胶囊 */}
        <div className="absolute left-3 top-0 bottom-0 flex flex-col justify-center gap-2.5 w-[122px]">
          <button
            onClick={() => onSelectNode && onSelectNode('codex')}
            className={`self-end px-2.5 h-[28px] rounded-[8px] bg-[#242429] border text-[12px] flex items-center gap-1.5 transition-colors cursor-pointer ${
              isRunning ? 'border-[#3b82f6]/70 text-[#f4f4f5]' : 'border-[#303036] text-[#e4e4e7]'
            }`}
          >
            <span className="w-4 h-4 rounded-[4px] bg-[#3b82f6] text-[#fff] text-[9px] font-mono font-bold flex items-center justify-center">
              &gt;_
            </span>
            <span className="font-medium">Codex</span>
          </button>

          <button
            onClick={() => onSelectNode && onSelectNode('dcc-agent-sdk')}
            className="self-end px-2.5 h-[28px] rounded-[8px] bg-[#242429] border border-[#303036] text-[12px] text-[#e4e4e7] flex items-center gap-1.5 cursor-pointer"
          >
            <Box className="w-3.5 h-3.5 text-[#a1a1aa]" />
            <span className="truncate max-w-[92px]">dcc-agent-sdk</span>
          </button>

          <button
            onClick={() => onSelectNode && onSelectNode('claude-code')}
            className={`self-end px-2.5 h-[28px] rounded-[8px] bg-[#242429] border text-[12px] flex items-center gap-1.5 cursor-pointer ${
              isFailed ? 'border-[#ef4444]/60 text-[#f4f4f5]' : 'border-[#303036] text-[#e4e4e7]'
            }`}
          >
            <span className="w-3.5 h-3.5 rounded-[3px] bg-[#d97757]/20 text-[#e08b6b] text-[9px] font-mono font-bold flex items-center justify-center">
              C
            </span>
            <span className="font-medium">Claude Code</span>
          </button>
        </div>

        {/* 中心圆环：DCCMCP 本地守护进程网关 */}
        <button
          title="DCCMCP Server (127.0.0.1:9765 · 统一汇聚 CLI Shim 与 MCP)"
          onClick={() => onSelectNode && onSelectNode('server')}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[42px] h-[42px] rounded-full bg-[#232329] border border-[#34343d] hover:border-[#52525e] flex items-center justify-center transition-colors cursor-pointer"
        >
          <DccMcpGlyph size={17} />
        </button>

        {/* 右列：非 MCP 软件原生实例胶囊 */}
        <div className="absolute right-3 top-0 bottom-0 flex flex-col justify-center gap-2.5 w-[128px]">
          <button
            onClick={() => onSelectNode && onSelectNode('blender-01')}
            className={`self-start px-2.5 h-[28px] rounded-[8px] bg-[#242429] border text-[12px] flex items-center gap-1.5 max-w-full cursor-pointer ${
              isRunning
                ? 'border-[#3b82f6]/70 text-[#f4f4f5]'
                : isCompleted
                ? 'border-[#22c55e]/60 text-[#f4f4f5]'
                : 'border-[#303036] text-[#e4e4e7]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isRunning ? 'bg-[#3b82f6]' : isCompleted ? 'bg-[#22c55e]' : 'bg-[#a1a1aa]'
              }`}
            />
            <span className="truncate font-medium">Blender #1</span>
          </button>

          <button
            onClick={() => onSelectNode && onSelectNode('zbrush-cua')}
            className="self-start px-2.5 h-[28px] rounded-[8px] bg-[#242429] border border-[#303036] text-[12px] text-[#d4d4d8] flex items-center gap-1.5 max-w-full cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-[#71717a] shrink-0" />
            <span className="truncate">dcc-cua · ZB</span>
          </button>

          <button
            onClick={() => onSelectNode && onSelectNode('ue-01')}
            className={`self-start px-2.5 h-[28px] rounded-[8px] bg-[#242429] border text-[12px] flex items-center gap-1.5 max-w-full cursor-pointer ${
              isFailed ? 'border-[#7f1d1d] text-[#fca5a5]' : 'border-[#303036] text-[#d4d4d8]'
            }`}
          >
            {isFailed ? (
              <X className="w-3.5 h-3.5 text-[#ef4444] shrink-0 stroke-[2.5]" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-[#71717a] shrink-0" />
            )}
            <span className="truncate font-medium">Unreal 5.4</span>
          </button>
        </div>
      </div>
    );
  }

  // 主窗口宽幅版：中心圆环汇聚路由图 (展示 CLI Shim vs MCP Shim -> DCCMCP Server -> Socket/RPC/CUA)
  return (
    <div className="relative w-full h-[256px] bg-[#161619] border border-[#26262b] rounded-[12px] overflow-hidden select-none">
      <svg viewBox="0 0 820 256" className="absolute inset-0 w-full h-full pointer-events-none">
        {/* 左 -> 中 4 条曲线 */}
        {[46, 98, 154, 208].map((y, i) => {
          const activeBlue = i === 0 && isRunning;
          const activeRed = i === 2 && isFailed;
          return (
            <path
              key={i}
              d={`M 255 ${y} C 325 ${y}, 330 128, 376 128`}
              fill="none"
              stroke={activeBlue ? '#3b82f6' : activeRed ? '#ef4444' : '#32323a'}
              strokeWidth={activeBlue || activeRed ? '1.8' : '1.2'}
            />
          );
        })}

        {/* 中 -> 右 4 条曲线 */}
        {[46, 98, 154, 208].map((y, i) => {
          const activeBlue = i === 0 && isRunning;
          const activeGreen = i === 0 && isCompleted;
          const activeRed = i === 3 && isFailed;
          return (
            <g key={i}>
              <path
                d={`M 444 128 C 490 128, 495 ${y}, 565 ${y}`}
                fill="none"
                stroke={
                  activeRed
                    ? '#ef4444'
                    : activeBlue
                    ? '#3b82f6'
                    : activeGreen
                    ? '#22c55e'
                    : '#32323a'
                }
                strokeWidth={activeBlue || activeRed || activeGreen ? '1.8' : '1.2'}
              />
              {activeBlue && <circle cx="508" cy="84" r="4" fill="#3b82f6" stroke="#161619" strokeWidth="1.5" />}
              {activeRed && <circle cx="508" cy="172" r="4" fill="#ef4444" stroke="#161619" strokeWidth="1.5" />}
            </g>
          );
        })}
      </svg>

      {/* 左列：Agent + 接入通道标签 (CLI Shim vs MCP Bridge) */}
      <div className="absolute left-5 top-0 bottom-0 w-[232px] flex flex-col justify-center gap-3">
        {[
          { id: 'codex', name: 'Codex', mode: 'CLI Shim · dccmcp exec', highlight: isRunning ? 'blue' : null },
          { id: 'dcc-agent-sdk', name: 'dcc-agent-sdk', mode: 'Unix Socket IPC', highlight: null },
          { id: 'claude-code', name: 'Claude Code', mode: 'CLI Shim · SKILL.md', highlight: isFailed ? 'red' : null },
          { id: 'cursor', name: 'Cursor', mode: 'MCP Bridge (3 元工具)', highlight: null },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectNode && onSelectNode(item.id)}
            className={`w-full px-3 h-[38px] rounded-[8px] bg-[#1e1e23] border flex items-center justify-between text-left transition-colors cursor-pointer ${
              item.highlight === 'blue'
                ? 'border-[#3b82f6]'
                : item.highlight === 'red'
                ? 'border-[#ef4444]/80'
                : 'border-[#2c2c33] hover:border-[#3f3f48]'
            }`}
          >
            <span className="text-[12.5px] font-medium text-[#f4f4f5]">{item.name}</span>
            <span className="px-1.5 py-0.5 rounded bg-[#151518] border border-[#292930] font-mono text-[10.5px] text-[#a1a1aa]">
              {item.mode}
            </span>
          </button>
        ))}
      </div>

      {/* 中心节点：DCCMCP Server 常驻守护进程 */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        <button
          onClick={() => onSelectNode && onSelectNode('server')}
          className="w-[66px] h-[66px] rounded-full bg-[#202026] border border-[#383842] hover:border-[#525260] flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors"
        >
          <DccMcpGlyph size={20} />
          <span className="text-[9.5px] font-mono text-[#a1a1aa]">:9765</span>
        </button>
        <span className="mt-1.5 text-[11px] font-mono text-[#71717a]">DCCMCP Server</span>
      </div>

      {/* 右列：目标软件实例及非 MCP 私有通信协议 */}
      <div className="absolute right-5 top-0 bottom-0 w-[236px] flex flex-col justify-center gap-3">
        {[
          { id: 'blender-01', label: 'Blender 4.2 #1', proto: 'Python Socket :51231', state: isRunning ? 'running' : 'connected' },
          { id: 'maya-01', label: 'Maya 2025 #1', proto: 'CommandPort :51238', state: 'connected' },
          { id: 'zbrush-cua', label: 'dcc-cua · ZBrush', proto: 'Win32 HWND 窗口控制', state: 'connected' },
          { id: 'ue-01', label: 'Unreal 5.4 · Level_01', proto: 'Editor WebSocket', state: isFailed ? 'failed' : 'connected' },
        ].map((inst) => (
          <button
            key={inst.id}
            onClick={() => onSelectNode && onSelectNode(inst.id)}
            className={`w-full px-3 h-[38px] rounded-[8px] bg-[#1e1e23] border flex items-center justify-between text-left transition-colors cursor-pointer ${
              inst.state === 'failed'
                ? 'border-[#7f1d1d] text-[#fca5a5]'
                : inst.state === 'running'
                ? 'border-[#3b82f6]'
                : 'border-[#2c2c33] hover:border-[#3f3f48]'
            }`}
          >
            <span className="flex items-center gap-2 text-[12.5px] font-medium truncate">
              {inst.state === 'failed' ? (
                <X className="w-3.5 h-3.5 text-[#ef4444] shrink-0 stroke-[2.5]" />
              ) : (
                <StatusDot state={inst.state} />
              )}
              <span className="truncate">{inst.label}</span>
            </span>
            <span className="font-mono text-[10.5px] text-[#8b8b93] shrink-0">{inst.proto}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// 工程级单色 DCC 视口快照 (用于可观测与溯源抽屉)
function ViewportWireframePreview({ failed = false }) {
  return (
    <svg viewBox="0 0 360 150" className="w-full h-[140px] bg-[#111113] rounded-[8px] border border-[#26262b]">
      <defs>
        <pattern id="dcc-ortho-grid" width="18" height="18" patternUnits="userSpaceOnUse">
          <path d="M 18 0 L 0 0 0 18" fill="none" stroke="#1b1b20" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="360" height="150" fill="url(#dcc-ortho-grid)" />
      <line x1="0" y1="75" x2="360" y2="75" stroke="#232329" />
      <line x1="180" y1="0" x2="180" y2="150" stroke="#232329" />
      <g transform="translate(180,75)" fill="none" stroke={failed ? '#ef4444' : '#a1a1aa'} strokeWidth="1.15">
        <polygon points="0,-42 36,-20 36,22 0,42 -36,22 -36,-20" />
        <polygon points="0,-24 20,-11 20,12 0,24 -20,12 -20,-11" stroke={failed ? '#7f1d1d' : '#52525b'} />
        <line x1="0" y1="-42" x2="0" y2="42" strokeOpacity="0.4" />
        <line x1="-36" y1="-20" x2="36" y2="22" strokeOpacity="0.4" />
      </g>
      <text x="10" y="16" fill="#71717a" fontSize="9.5" fontFamily="monospace">
        {failed ? 'UE5.4 · Level_01 [WS_HANDSHAKE_ERR]' : 'Blender 4.2 #1 · char_rig.blend [PID 48210]'}
      </text>
      <text x="10" y="140" fill={failed ? '#ef4444' : '#a1a1aa'} fontSize="9.5" fontFamily="monospace">
        {failed ? 'ERR: Editor WebSocket port 51249 closed' : 'OK · 24,800 Tris · Bake 2048x2048 PBR'}
      </text>
    </svg>
  );
}

// ============================================================================
// 3. 托盘小窗口组件 (1:1 复刻 Magpie 托盘悬浮窗设计)
// ============================================================================

function TrayMiniWindow({
  lifecycleState,
  runProgress,
  agents,
  dccInstances,
  ecosystemItems,
  feedItems,
  onToggleAgent,
  onOpenMain,
  onSelectFeedItem,
  onRetryFailed,
  onCloseOverlay,
  isOverlay = false,
}) {
  const [miniTab, setMiniTab] = useState('route'); // 'agents' | 'instances' | 'skills' | 'route'
  const [probing, setProbing] = useState(false);
  const [miniSkillQuery, setMiniSkillQuery] = useState('');

  const connectedAgentCount = agents.filter((a) => a.connected).length;

  const triggerProbe = () => {
    setProbing(true);
    setTimeout(() => setProbing(false), 500);
  };

  return (
    <div className="w-[388px] h-[576px] bg-[#161618] border border-[#2b2b31] rounded-[16px] shadow-2xl flex flex-col overflow-hidden text-[#f4f4f5] select-none">
      {/* 1. 顶栏: 品牌 + 刷新与设置图标 */}
      <div className="h-[46px] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <DccMcpGlyph size={18} />
          <span className="text-[15px] font-semibold tracking-tight text-[#f4f4f5]">dcc-mcp</span>
        </div>
        <div className="flex items-center gap-2.5 text-[#a1a1aa]">
          <button
            title="刷新实例与心跳"
            onClick={triggerProbe}
            className="p-1 rounded hover:bg-[#232328] hover:text-[#f4f4f5] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-[15px] h-[15px] ${probing ? 'animate-spin text-[#f4f4f5]' : ''}`} />
          </button>
          <button
            title="打开主窗口设置"
            onClick={() => onOpenMain('daemon')}
            className="p-1 rounded hover:bg-[#232328] hover:text-[#f4f4f5] transition-colors cursor-pointer"
          >
            <Settings className="w-[15px] h-[15px]" />
          </button>
          {isOverlay && onCloseOverlay && (
            <button
              title="收起悬浮窗"
              onClick={onCloseOverlay}
              className="p-1 rounded hover:bg-[#232328] hover:text-[#f4f4f5] transition-colors cursor-pointer"
            >
              <X className="w-[15px] h-[15px]" />
            </button>
          )}
        </div>
      </div>

      {/* 2. 四段式胶囊导航栏: Agent 6 | 实例 4 | 技能 144 | 路由 */}
      <div className="px-4 pb-2.5 shrink-0">
        <div className="grid grid-cols-4 gap-1 bg-[#131315] p-1 rounded-[10px] border border-[#222227]">
          {[
            { id: 'agents', label: `Agent ${connectedAgentCount}` },
            { id: 'instances', label: `实例 ${dccInstances.length}` },
            { id: 'skills', label: '技能 144' },
            { id: 'route', label: '路由' },
          ].map((tab) => {
            const active = miniTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setMiniTab(tab.id)}
                className={`h-[30px] rounded-[8px] text-[12.5px] transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#25252b] text-[#f4f4f5] font-medium border border-[#34343c]'
                    : 'text-[#9ca3af] hover:text-[#e4e4e7]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. 主体可切换内容区 */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2.5 pb-2">
        {/* === TAB: 路由 (默认核心视图，1:1 对齐截图) === */}
        {miniTab === 'route' && (
          <>
            {/* 当日调用统计行 */}
            <div className="px-0.5 py-0.5 flex items-center justify-between text-[12.5px]">
              <div className="flex items-center gap-2 text-[#a1a1aa]">
                <StatusDot state={lifecycleState} />
                <span>
                  今天 <strong className="text-[#f4f4f5] font-semibold">418</strong> 次调用 · CLI{' '}
                  <strong className="text-[#f4f4f5] font-semibold">386</strong> / MCP{' '}
                  <strong className="text-[#f4f4f5] font-semibold">32</strong>
                </span>
              </div>
              <button
                onClick={() => onOpenMain('topology')}
                className="text-[#a1a1aa] hover:text-[#f4f4f5] transition-colors cursor-pointer"
              >
                打开路由
              </button>
            </div>

            {/* 中心圆环贝塞尔汇聚路由卡片 */}
            <CircularHubRoutingGraph
              compact
              lifecycleState={lifecycleState}
              onSelectNode={() => onOpenMain('topology')}
            />

            {/* 实时执行流滚动卡片 (双行结构，复刻截图样式) */}
            <div className="bg-[#1c1c20] border border-[#28282d] rounded-[12px] divide-y divide-[#25252a] overflow-hidden">
              {feedItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectFeedItem(item)}
                  className="px-3.5 py-2.5 hover:bg-[#222227] transition-colors cursor-pointer space-y-1"
                >
                  {/* 第一行: Agent 图标 + 名称 + 暗色胶囊命令标签 + 右侧时间戳 */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-[18px] h-[18px] rounded-[5px] text-[9.5px] font-mono font-bold flex items-center justify-center shrink-0 border border-[#32323a]"
                        style={{ backgroundColor: item.badgeBg, color: item.badgeColor }}
                      >
                        {item.mark}
                      </span>
                      <span className="text-[12.5px] font-medium text-[#f4f4f5] shrink-0">{item.agent}</span>
                      <span className="px-2 py-0.5 rounded-[5px] bg-[#141417] border border-[#29292f] font-mono text-[11px] text-[#d4d4d8] truncate">
                        {item.pill}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-[#71717a] shrink-0">{item.time}</span>
                  </div>

                  {/* 第二行: 箭头 + 目标软件执行描述 + 右侧耗时/重试 */}
                  <div className="flex items-center justify-between gap-2 text-[12px] pl-0.5">
                    <div className="flex items-center gap-1.5 min-w-0 truncate">
                      <span
                        className={`font-mono ${
                          item.state === 'running'
                            ? 'text-[#3b82f6]'
                            : item.state === 'failed'
                            ? 'text-[#ef4444]'
                            : 'text-[#71717a]'
                        }`}
                      >
                        →
                      </span>
                      <span
                        className={`truncate ${
                          item.state === 'failed'
                            ? 'text-[#fca5a5]'
                            : item.state === 'running'
                            ? 'text-[#d4d4d8]'
                            : 'text-[#9ca3af]'
                        }`}
                      >
                        {item.state === 'running'
                          ? `Blender #1 正在烘焙贴图 (${runProgress}%)...`
                          : item.detail}
                      </span>
                    </div>

                    {item.state === 'failed' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRetryFailed();
                        }}
                        className="text-[11px] text-[#f4f4f5] hover:underline shrink-0 cursor-pointer"
                      >
                        2 次尝试 · 重试
                      </button>
                    ) : (
                      item.metrics && (
                        <span className="text-[11px] font-mono text-[#71717a] shrink-0">{item.metrics}</span>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* === TAB: Agent 快捷开关列表 === */}
        {miniTab === 'agents' && (
          <div className="bg-[#1c1c20] border border-[#28282d] rounded-[12px] divide-y divide-[#25252a]">
            {agents.slice(0, 7).map((ag) => (
              <div key={ag.id} className="px-3.5 py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12.5px] font-medium text-[#f4f4f5]">{ag.name}</span>
                    <span className="px-1.5 py-0.2 rounded bg-[#141417] border border-[#2b2b32] font-mono text-[10px] text-[#a1a1aa]">
                      {ag.ingressShort}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#71717a] truncate mt-0.5">{ag.configPath}</div>
                </div>
                <MagpieToggle size="sm" checked={ag.connected} onChange={() => onToggleAgent(ag.id)} />
              </div>
            ))}
          </div>
        )}

        {/* === TAB: 实例 (运行中 DCC 软件窗口与协议) === */}
        {miniTab === 'instances' && (
          <div className="bg-[#1c1c20] border border-[#28282d] rounded-[12px] divide-y divide-[#25252a]">
            {dccInstances.map((inst) => {
              const isUeErr = inst.id === 'ue-01' && lifecycleState === 'failed';
              return (
                <div key={inst.id} className="px-3.5 py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {isUeErr ? (
                        <X className="w-3.5 h-3.5 text-[#ef4444]" />
                      ) : (
                        <StatusDot state={inst.id === 'blender-01' && lifecycleState === 'running' ? 'running' : 'connected'} />
                      )}
                      <span className="text-[12.5px] font-medium text-[#f4f4f5]">{inst.windowTag}</span>
                      <span className="font-mono text-[11px] text-[#9ca3af] truncate">{inst.scene}</span>
                    </div>
                    <div className="text-[11px] font-mono text-[#71717a] mt-0.5">
                      {inst.protocol} · {inst.endpoint}
                    </div>
                  </div>
                  <span className="text-[11px] text-[#8b8b93] shrink-0">
                    {isUeErr ? '未响应' : inst.lockedBy ? '占用中' : '空闲'}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* === TAB: 技能 144 (快捷检索按需 CLI Skills) === */}
        {miniTab === 'skills' && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#71717a] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={miniSkillQuery}
                onChange={(e) => setMiniSkillQuery(e.target.value)}
                placeholder="检索 CLI 技能包 (共 144 项)..."
                className="w-full h-[30px] pl-8 pr-3 rounded-[8px] bg-[#1c1c20] border border-[#2b2b31] text-[12px] text-[#f4f4f5] placeholder-[#71717a] focus:outline-none"
              />
            </div>
            <div className="bg-[#1c1c20] border border-[#28282d] rounded-[12px] divide-y divide-[#25252a]">
              {ecosystemItems
                .filter(
                  (it) =>
                    !miniSkillQuery ||
                    it.name.toLowerCase().includes(miniSkillQuery.toLowerCase()) ||
                    it.cliPrefix.toLowerCase().includes(miniSkillQuery.toLowerCase())
                )
                .slice(0, 6)
                .map((it) => (
                  <div key={it.id} className="px-3.5 py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[12px] font-medium text-[#e4e4e7] truncate">{it.name}</div>
                      <div className="text-[10.5px] font-mono text-[#71717a] truncate">{it.cliPrefix}</div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-[#141417] border border-[#29292f] text-[10px] text-[#a1a1aa] shrink-0">
                      {it.badge}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. 底部操作栏: 打开主窗口 | 退出 (1:1 复刻截图右下角) */}
      <div className="h-[40px] px-4 border-t border-[#232328] flex items-center justify-between text-[12.5px] shrink-0 bg-[#151517]">
        <span className="font-mono text-[11px] text-[#63636b]">127.0.0.1:9765</span>
        <div className="flex items-center gap-4">
          <button
            onClick={() => onOpenMain('agents')}
            className="text-[#a1a1aa] hover:text-[#f4f4f5] transition-colors cursor-pointer"
          >
            打开主窗口
          </button>
          <button
            onClick={() => (onCloseOverlay ? onCloseOverlay() : onOpenMain('agents'))}
            className="text-[#a1a1aa] hover:text-[#f4f4f5] transition-colors cursor-pointer"
          >
            退出
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. 顶层主应用 (支持「托盘小窗口模式」、「主窗口模式」及「主窗+右下角悬浮托盘双开」)
// ============================================================================

export default function App() {
  // 窗口展示模式: 'main' (主窗口) | 'tray' (独立系统托盘模式)
  const [windowMode, setWindowMode] = useState('main');
  // 在主窗口右下角同时叠加悬浮小窗口预览，方便直观对照两套窗口实时同步
  const [floatingTrayOpen, setFloatingTrayOpen] = useState(true);

  // 主窗口左侧路由: 'agents' | 'dcc' | 'artifacts' | 'topology' | 'daemon' | 'plugins' | 'traces'
  const [activeNav, setActiveNav] = useState('agents');

  // 四态生命周期模拟器: 'connected' | 'running' | 'failed' | 'completed'
  const [lifecycleState, setLifecycleState] = useState('running');
  const [runProgress, setRunProgress] = useState(64);
  const [autoCycle, setAutoCycle] = useState(false);

  // 核心业务状态
  const [agents, setAgents] = useState(INITIAL_AGENTS);
  const [unconnectedFolded, setUnconnectedFolded] = useState(false);
  const [dccInstances] = useState(INITIAL_DCC_INSTANCES);
  const [ecosystemItems, setEcosystemItems] = useState(INITIAL_ECOSYSTEM_ITEMS);
  const [marketplaces, setMarketplaces] = useState(INITIAL_MARKETPLACES);
  const [artifacts, setArtifacts] = useState(INITIAL_ARTIFACTS);

  // 「插件与市场」页五维胶囊筛选 (对齐截图 2 & 3)
  const [pluginSubTab, setPluginSubTab] = useState('plugins'); // 'plugins' | 'apps' | 'mcp' | 'skills' | 'market'
  const [pluginSearch, setPluginSearch] = useState('');
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [addMarketModal, setAddMarketModal] = useState(false);
  const [newMarketPath, setNewMarketPath] = useState(
    'C:\\Users\\loonghao\\.codex\\marketplaces\\houdini-studio\\marketplace.json'
  );

  // 检视抽屉与安装引导弹窗
  const [inspectedAgentId, setInspectedAgentId] = useState(null);
  const [inspectedLineage, setInspectedLineage] = useState(null);
  const [bridgeWizardOpen, setBridgeWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  // 自动推进演练逻辑
  useEffect(() => {
    if (lifecycleState !== 'running') return;
    const timer = setInterval(() => {
      setRunProgress((prev) => {
        if (prev >= 95) {
          if (autoCycle) {
            setAutoCycle(false);
            setLifecycleState('completed');
            return 100;
          }
          return 64;
        }
        return prev + 5;
      });
    }, 550);
    return () => clearInterval(timer);
  }, [lifecycleState, autoCycle]);

  // 随四态演进动态生成实时执行流 (同时驱动小窗口与可观测页)
  const liveFeedItems = useMemo(() => {
    const dynamicTop =
      lifecycleState === 'running'
        ? {
            id: 'f-live-run',
            agent: 'Codex',
            mark: '>_',
            badgeBg: '#2563eb',
            badgeColor: '#ffffff',
            pill: 'cli · blender/bake_pbr',
            time: '15:49:44',
            state: 'running',
            detail: 'Blender #1 (char_rig.blend) 正在烘焙贴图...',
            metrics: 'CLI shim',
            cliCmd: 'dccmcp exec blender bake_pbr --instance blender-01 --res 2048',
            targetDcc: 'Blender 4.2 · char_rig.blend',
            protocol: 'Python Socket (:51231)',
          }
        : lifecycleState === 'failed'
        ? {
            id: 'f-live-fail',
            agent: 'Claude Code',
            mark: 'CC',
            badgeBg: '#2b1e1a',
            badgeColor: '#f87171',
            pill: 'cli · unreal/sync_level',
            time: '15:49:44',
            state: 'failed',
            detail: 'Unreal 5.4 · Editor WebSocket 握手超时',
            metrics: '2 次尝试',
            cliCmd: 'dccmcp exec unreal sync_level --instance ue-01 --map Level_01',
            targetDcc: 'Unreal 5.4 · Level_01.umap',
            protocol: 'Editor WebSocket (:51249)',
          }
        : lifecycleState === 'completed'
        ? {
            id: 'f-live-done',
            agent: 'Codex',
            mark: '>_',
            badgeBg: '#2563eb',
            badgeColor: '#ffffff',
            pill: 'cli · blender/bake_pbr',
            time: '15:49:44',
            state: 'completed',
            detail: 'Blender #1 · char_rig_baked_2k.glb',
            metrics: '4.8 秒 · 19.4MB',
            cliCmd: 'dccmcp exec blender bake_pbr --instance blender-01 --res 2048',
            targetDcc: 'Blender 4.2 · char_rig.blend',
            protocol: 'Python Socket (:51231)',
          }
        : {
            id: 'f-live-idle',
            agent: 'Codex',
            mark: '>_',
            badgeBg: '#2563eb',
            badgeColor: '#ffffff',
            pill: 'cli · daemon/heartbeat',
            time: '15:49:40',
            state: 'connected',
            detail: 'DCCMCP Server 全部桥接就绪 · 等待指令',
            metrics: '0.8 ms',
            cliCmd: 'dccmcp status --all-instances',
            targetDcc: '127.0.0.1:9765',
            protocol: 'Local HTTP/IPC',
          };

    return [
      dynamicTop,
      {
        id: 'f-2',
        agent: 'dcc-agent-sdk',
        mark: 'SD',
        badgeBg: '#232329',
        badgeColor: '#d4d4d8',
        pill: 'cua · zbrush/decimate',
        time: '15:49:29',
        state: 'completed',
        detail: 'dcc-cua · ZBrush 2026 · armor_lowpoly.obj',
        metrics: '6.1 秒 · HWND',
        cliCmd: 'dccmcp exec cua zremesh_export --hwnd 0x00140A --target-polys 15000',
        targetDcc: 'dcc-cua · ZBrush 2026',
        protocol: 'CUA Win32 HWND',
      },
      {
        id: 'f-3',
        agent: 'Claude Code',
        mark: 'CC',
        badgeBg: '#261e1b',
        badgeColor: '#e08b6b',
        pill: 'cli · maya/validate_rig',
        time: '15:49:21',
        state: 'completed',
        detail: 'Maya 2025 · lookdev.mb · 68 骨骼校验通过',
        metrics: '1.2 秒 · RPC',
        cliCmd: 'dccmcp exec maya validate_skeleton --instance maya-01',
        targetDcc: 'Maya 2025 · lookdev.mb',
        protocol: 'CommandPort RPC (:51238)',
      },
      {
        id: 'f-4',
        agent: 'Cursor',
        mark: 'CU',
        badgeBg: '#232328',
        badgeColor: '#e4e4e7',
        pill: 'mcp · scene/inspect',
        time: '15:49:10',
        state: 'completed',
        detail: 'Blender #1 · 读取场景层级树 (38 节点)',
        metrics: '0.4 秒 · MCP',
        cliCmd: 'dccmcp mcp-shim -> invoke_action("blender.list_objects")',
        targetDcc: 'Blender 4.2 · char_rig.blend',
        protocol: 'MCP Meta -> Socket',
      },
    ];
  }, [lifecycleState, runProgress]);

  const handleStartAutoDemo = () => {
    setAutoCycle(true);
    setRunProgress(20);
    setLifecycleState('running');
  };

  const toggleAgent = (id) => {
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, connected: !a.connected } : a)));
  };

  const updateAgentField = (id, field, val) => {
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: val } : a)));
  };

  const toggleEcosystemItem = (id) => {
    setEcosystemItems((prev) => prev.map((it) => (it.id === id ? { ...it, enabled: !it.enabled } : it)));
  };

  const handleAddMarketplace = (e) => {
    e.preventDefault();
    if (!newMarketPath.trim()) return;
    setMarketplaces((prev) => [
      {
        id: `mkt-${Date.now()}`,
        name: 'HOUDINI-STUDIO-LOCAL',
        countText: '2 个插件 · 19 项技能',
        path: newMarketPath.trim(),
        hasUpgrade: false,
      },
      ...prev,
    ]);
    setAddMarketModal(false);
  };

  const connectedAgents = useMemo(() => agents.filter((a) => a.connected), [agents]);
  const availableAgents = useMemo(() => agents.filter((a) => !a.connected), [agents]);
  const inspectedAgent = useMemo(
    () => agents.find((a) => a.id === inspectedAgentId) || null,
    [agents, inspectedAgentId]
  );

  // 过滤插件/应用/MCP/技能
  const filteredEcoItems = useMemo(() => {
    return ecosystemItems.filter((it) => {
      const matchTab = it.tab === pluginSubTab;
      const q = pluginSearch.trim().toLowerCase();
      const matchQ =
        !q ||
        it.name.toLowerCase().includes(q) ||
        it.desc.toLowerCase().includes(q) ||
        it.cliPrefix.toLowerCase().includes(q);
      return matchTab && matchQ;
    });
  }, [ecosystemItems, pluginSubTab, pluginSearch]);

  const navTitleMap = {
    agents: ['接入与使用', 'Agent 接入 (CLI & MCP)'],
    dcc: ['接入与使用', '软件与实例 (DCC Bridges)'],
    artifacts: ['接入与使用', '产物与血缘 (Artifacts)'],
    topology: ['调度与网关', '路由与拓扑'],
    daemon: ['调度与网关', '服务网关 (DCCMCP Server)'],
    plugins: ['扩展与生态', '插件与市场'],
    traces: ['可观测', '调用链路与日志'],
  };

  return (
    <div
      className="h-screen w-full bg-[#0f0f10] text-[#f4f4f5] flex flex-col overflow-hidden antialiased"
      style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif' }}
    >
      {/* ====================================================================
          顶部超薄原型控制条：一键切换「主窗口 / 托盘小窗口 / 双窗同屏」与「四态模拟」
         ==================================================================== */}
      <div className="h-[38px] px-4 bg-[#0b0b0c] border-b border-[#202024] flex items-center justify-between gap-3 shrink-0 z-40">
        {/* 左侧：窗口形态切换器 */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#161619] border border-[#27272d] rounded-[7px] p-0.5 text-[11.5px]">
            <button
              onClick={() => setWindowMode('main')}
              className={`px-2.5 py-0.5 rounded-[5px] flex items-center gap-1.5 transition-colors cursor-pointer ${
                windowMode === 'main' ? 'bg-[#28282f] text-[#f4f4f5] font-medium' : 'text-[#8b8b93] hover:text-[#e4e4e7]'
              }`}
            >
              <Layout className="w-3 h-3" />
              <span>主窗口模式</span>
            </button>
            <button
              onClick={() => setWindowMode('tray')}
              className={`px-2.5 py-0.5 rounded-[5px] flex items-center gap-1.5 transition-colors cursor-pointer ${
                windowMode === 'tray' ? 'bg-[#28282f] text-[#f4f4f5] font-medium' : 'text-[#8b8b93] hover:text-[#e4e4e7]'
              }`}
            >
              <AppWindow className="w-3 h-3" />
              <span>托盘小窗口模式</span>
            </button>
          </div>

          {windowMode === 'main' && (
            <button
              onClick={() => setFloatingTrayOpen(!floatingTrayOpen)}
              className={`px-2.5 py-1 rounded-[6px] border text-[11.5px] hidden md:flex items-center gap-1.5 transition-colors cursor-pointer ${
                floatingTrayOpen
                  ? 'bg-[#202026] border-[#383842] text-[#f4f4f5]'
                  : 'bg-[#141416] border-[#25252b] text-[#8b8b93] hover:text-[#e4e4e7]'
              }`}
            >
              <Minimize2 className="w-3 h-3" />
              <span>{floatingTrayOpen ? '已开启右下角小窗联动' : '叠加小窗口预览'}</span>
            </button>
          )}
        </div>

        {/* 右侧：四态生命周期切换器 + 自动演练 */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#71717a] hidden lg:inline">状态机模拟:</span>
          <div className="flex items-center bg-[#161619] border border-[#27272d] rounded-[7px] p-0.5 text-[11.5px]">
            {[
              { id: 'connected', label: 'Connected' },
              { id: 'running', label: 'Running' },
              { id: 'failed', label: 'Failed' },
              { id: 'completed', label: 'Completed' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => {
                  setAutoCycle(false);
                  if (st.id === 'running' && (runProgress < 10 || runProgress >= 100)) setRunProgress(64);
                  setLifecycleState(st.id);
                }}
                className={`px-2.5 py-0.5 rounded-[5px] flex items-center gap-1.5 transition-colors cursor-pointer ${
                  lifecycleState === st.id
                    ? 'bg-[#28282f] text-[#f4f4f5] font-medium'
                    : 'text-[#8b8b93] hover:text-[#e4e4e7]'
                }`}
              >
                <StatusDot state={st.id} />
                <span>{st.label}</span>
              </button>
            ))}
            <div className="w-[1px] h-3.5 bg-[#2a2a30] mx-1" />
            <button
              onClick={handleStartAutoDemo}
              className="px-2 py-0.5 rounded-[5px] text-[#e4e4e7] hover:bg-[#26262d] flex items-center gap-1 cursor-pointer"
            >
              <Play className="w-2.5 h-2.5 fill-current" />
              <span>{autoCycle ? '演练中' : '自动演练'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================================
          MODE A: 独立系统托盘小窗口桌面预览模式 (1:1 复刻 Windows 11 右下角托盘场景)
         ==================================================================== */}
      {windowMode === 'tray' ? (
        <div className="flex-1 relative bg-[#0d0d0f] flex flex-col justify-between overflow-hidden">
          {/* 桌面背景低调上下文说明（模拟正在后台运行的 CLI 与 DCC 工作区） */}
          <div className="p-8 max-w-[520px] space-y-2 opacity-65 pointer-events-none select-none hidden sm:block">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#63636b]">
              Active Workstation Background
            </div>
            <div className="p-3.5 rounded-[8px] bg-[#131316] border border-[#222227] font-mono text-[11.5px] text-[#8b8b93] space-y-1">
              <div>$ codex "Bake 2K PBR maps on char_rig.blend and export GLB"</div>
              <div className="text-[#a1a1aa]">
                ▸ invoking CLI shim: dccmcp exec blender bake_pbr --instance blender-01
              </div>
              <div className="text-[#71717a]">
                ▸ routed via DCCMCP Server (127.0.0.1:9765) → Python Socket :51231
              </div>
            </div>
          </div>

          {/* 右下角悬浮托盘小窗口主体 */}
          <div className="flex-1 flex items-center justify-center sm:items-end sm:justify-end sm:pr-6 sm:pb-3">
            <TrayMiniWindow
              lifecycleState={lifecycleState}
              runProgress={runProgress}
              agents={agents}
              dccInstances={dccInstances}
              ecosystemItems={ecosystemItems}
              feedItems={liveFeedItems}
              onToggleAgent={toggleAgent}
              onOpenMain={(targetTab) => {
                setActiveNav(targetTab || 'agents');
                setWindowMode('main');
              }}
              onSelectFeedItem={(item) => setInspectedLineage(item)}
              onRetryFailed={handleStartAutoDemo}
              onCloseOverlay={() => {}}
            />
          </div>

          {/* 拟真极简系统托盘任务栏 (复刻截图底部任务栏) */}
          <div className="h-[42px] px-5 bg-[#121215] border-t border-[#222227] flex items-center justify-between text-[12px] text-[#a1a1aa] shrink-0">
            <div className="flex items-center gap-3 text-[11.5px] text-[#71717a]">
              <span>Blender 4.2 [char_rig.blend]</span>
              <span>·</span>
              <span>Terminal — codex</span>
            </div>
            <div className="flex items-center gap-3.5">
              <ChevronUp className="w-3.5 h-3.5 text-[#8b8b93]" />
              <button
                onClick={() => setWindowMode('main')}
                title="点击打开主窗口"
                className="px-2 py-0.5 rounded bg-[#24242a] border border-[#363640] text-[#f4f4f5] flex items-center gap-1.5 text-[11px] cursor-pointer"
              >
                <DccMcpGlyph size={12} />
                <span>dcc-mcp</span>
              </button>
              <Wifi className="w-3.5 h-3.5 text-[#a1a1aa]" />
              <Volume2 className="w-3.5 h-3.5 text-[#a1a1aa]" />
              <div className="text-right leading-tight font-mono text-[10.5px] text-[#d4d4d8]">
                <div>15:49</div>
                <div className="text-[#71717a]">2026/11/24</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ====================================================================
            MODE B: Magpie 风格完整主窗口控制台 (含可选右下角托盘悬浮小窗)
           ==================================================================== */
        <div className="flex-1 flex min-h-0 bg-[#161618] relative">
          {/* 左侧分组导航栏 (212px, #121214) */}
          <aside className="w-[212px] shrink-0 bg-[#121214] border-r border-[#232328] flex flex-col justify-between select-none">
            <div className="overflow-y-auto">
              {/* 顶部客户端标识 + 最小化至托盘按钮 */}
              <div className="h-[46px] px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DccMcpGlyph size={17} />
                  <span className="text-[14.5px] font-semibold tracking-tight text-[#f4f4f5]">dcc-mcp</span>
                </div>
                <button
                  title="切换到托盘小窗口"
                  onClick={() => setWindowMode('tray')}
                  className="p-1.5 rounded-[6px] text-[#71717a] hover:text-[#f4f4f5] hover:bg-[#1e1e23] transition-colors cursor-pointer"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 侧边栏分组菜单 */}
              <div className="px-2.5 py-2 space-y-4">
                {[
                  {
                    group: '接入与使用',
                    items: [
                      { id: 'agents', label: 'Agent 接入', icon: Cpu, badge: connectedAgents.length },
                      { id: 'dcc', label: '软件与实例', icon: Layers, badge: dccInstances.length },
                      { id: 'artifacts', label: '产物 (Artifacts)', icon: Box, badge: artifacts.length },
                    ],
                  },
                  {
                    group: '调度与网关',
                    items: [
                      { id: 'topology', label: '路由与拓扑', icon: Waypoints },
                      { id: 'daemon', label: '服务网关', icon: Server },
                    ],
                  },
                  {
                    group: '扩展与生态',
                    items: [{ id: 'plugins', label: '插件与市场', icon: Puzzle, badge: '10' }],
                  },
                  {
                    group: '可观测',
                    items: [
                      {
                        id: 'traces',
                        label: '调用链路与日志',
                        icon: Activity,
                        dot: lifecycleState === 'failed' ? 'failed' : lifecycleState === 'running' ? 'running' : null,
                      },
                    ],
                  },
                ].map((section) => (
                  <div key={section.group}>
                    <div className="px-2.5 mb-1 text-[11px] text-[#63636b]">{section.group}</div>
                    <div className="space-y-0.5">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const active = activeNav === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setActiveNav(item.id)}
                            className={`w-full h-[31px] px-2.5 rounded-[7px] text-[12.5px] flex items-center justify-between transition-colors cursor-pointer ${
                              active
                                ? 'bg-[#242429] text-[#f4f4f5] font-medium'
                                : 'text-[#9ca3af] hover:text-[#e4e4e7] hover:bg-[#1a1a1e]'
                            }`}
                          >
                            <span className="flex items-center gap-2.5">
                              <Icon className="w-[14px] h-[14px] text-[#7e7e87]" strokeWidth={1.75} />
                              <span>{item.label}</span>
                            </span>
                            {item.dot ? (
                              <StatusDot state={item.dot} />
                            ) : (
                              item.badge !== undefined && (
                                <span className="font-mono text-[11px] text-[#63636b]">{item.badge}</span>
                              )
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 侧边栏底部：常驻 Server + CLI Shim 就绪状态 */}
            <div className="p-2.5 border-t border-[#222227] space-y-1">
              <button
                onClick={() => setActiveNav('daemon')}
                className="w-full h-[29px] px-2.5 rounded-[6px] text-[12.5px] text-[#9ca3af] hover:text-[#f4f4f5] hover:bg-[#1a1a1e] flex items-center gap-2.5 cursor-pointer"
              >
                <Settings className="w-[14px] h-[14px] text-[#71717a]" />
                <span>设置</span>
              </button>
              <div
                onClick={() => setActiveNav('daemon')}
                className="px-2.5 py-1.5 rounded-[6px] hover:bg-[#1a1a1e] flex items-center justify-between text-[11px] text-[#8b8b93] cursor-pointer"
              >
                <span className="flex items-center gap-2 truncate font-mono">
                  <StatusDot state={lifecycleState} />
                  <span>127.0.0.1:9765</span>
                </span>
                <span className="text-[#63636b] font-mono">CLI 就绪</span>
              </div>
            </div>
          </aside>

          {/* 右侧主内容区 */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#161618]">
            {/* 主窗口顶部面包屑栏 */}
            <header className="h-[46px] px-7 border-b border-[#232328] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-[12.5px]">
                <span className="text-[#71717a]">{navTitleMap[activeNav]?.[0]}</span>
                <span className="text-[#52525b]">/</span>
                <span className="text-[#f4f4f5] font-medium">{navTitleMap[activeNav]?.[1]}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    setWizardStep(1);
                    setBridgeWizardOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-[6px] bg-[#202025] hover:bg-[#27272d] border border-[#2e2e35] text-[12px] text-[#e4e4e7] flex items-center gap-1.5 cursor-pointer"
                >
                  <Wrench className="w-3 h-3 text-[#a1a1aa]" />
                  <span>DCC 自动装配向导</span>
                </button>
              </div>
            </header>

            {/* 主内容滚动区 */}
            <main className="flex-1 overflow-y-auto">
              <div className="max-w-[940px] mx-auto px-8 py-6 pb-24">
                {/* ==========================================================
                    VIEW 1: Agent 接入 (解决 CLI vs MCP 双通道表述与自动注入检视)
                   ========================================================== */}
                {activeNav === 'agents' && (
                  <div>
                    <p className="text-[12.5px] text-[#9ca3af] leading-relaxed">
                      开启「接入」后，<code className="font-mono text-[#e4e4e7]">dcc-mcp</code> 会自动将轻量 CLI 转发器（
                      <code className="font-mono text-[#e4e4e7]">dccmcp</code>）与按需加载的{' '}
                      <code className="font-mono text-[#e4e4e7]">SKILL.md</code> 或精简 MCP 元工具桥注入对应 Agent。所有无状态 CLI 短进程调用与 MCP 会话均统一经本地{' '}
                      <code className="font-mono text-[#e4e4e7]">DCCMCP Server</code> 路由并完整留痕。
                    </p>

                    <div className="mt-3.5 mb-3 flex items-center justify-between text-[12px] text-[#8b8b93]">
                      <span>
                        已自动装配 {connectedAgents.length} 个本机 Agent · 点击任意行可检视注入的 SKILL.md / PATH Shim 详情
                      </span>
                      <button
                        onClick={() => setActiveNav('topology')}
                        className="text-[#d4d4d8] hover:underline cursor-pointer"
                      >
                        查看 CLI + MCP 汇聚拓扑 ›
                      </button>
                    </div>

                    {/* 已接入列表 */}
                    <div className="border-t border-[#242429] divide-y divide-[#242429]">
                      {connectedAgents.map((ag) => (
                        <div
                          key={ag.id}
                          onClick={() => setInspectedAgentId(ag.id)}
                          className="py-3.5 px-2.5 -mx-2.5 rounded-[8px] hover:bg-[#1c1c20] transition-colors flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 cursor-pointer"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div
                              className="w-[28px] h-[28px] rounded-[6px] border border-[#2f2f37] flex items-center justify-center text-[10.5px] font-mono font-semibold shrink-0"
                              style={{ backgroundColor: ag.markBg, color: ag.markColor }}
                            >
                              {ag.mark}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[13.5px] font-medium text-[#f4f4f5]">{ag.name}</span>
                                <span className="font-mono text-[11.5px] text-[#71717a]">{ag.version}</span>
                                {ag.updateTo && (
                                  <span className="text-[11.5px] text-[#9ca3af]">↑ 更新到 {ag.updateTo}</span>
                                )}
                              </div>
                              <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[#8b8b93] truncate">
                                <StatusDot
                                  state={
                                    ag.id === 'codex' && lifecycleState === 'running'
                                      ? 'running'
                                      : ag.id === 'claude-code' && lifecycleState === 'failed'
                                      ? 'failed'
                                      : 'connected'
                                  }
                                />
                                <span className="truncate">{ag.descConnected}</span>
                              </div>
                            </div>
                          </div>

                          {/* 右侧：接入通道下拉 + 暴露能力集下拉 + Magpie 拨动开关 */}
                          <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <div className="relative">
                              <select
                                value={ag.ingressMode}
                                onChange={(e) => updateAgentField(ag.id, 'ingressMode', e.target.value)}
                                className="appearance-none h-[28px] pl-2.5 pr-6 rounded-[6px] bg-[#202025] hover:bg-[#26262c] border border-[#2f2f36] text-[11.5px] text-[#e4e4e7] focus:outline-none cursor-pointer"
                              >
                                <option value="CLI + Skills (推荐)">CLI + Skills (推荐)</option>
                                <option value="MCP Bridge (元工具)">MCP Bridge (元工具)</option>
                                <option value="CLI + MCP 双通道">CLI + MCP 双通道</option>
                              </select>
                              <ChevronDown className="w-3 h-3 text-[#71717a] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>

                            <div className="relative hidden md:block">
                              <select
                                value={ag.scopeProfile}
                                onChange={(e) => updateAgentField(ag.id, 'scopeProfile', e.target.value)}
                                className="appearance-none h-[28px] pl-2.5 pr-6 rounded-[6px] bg-[#1c1c21] border border-[#2c2c33] text-[11.5px] text-[#a1a1aa] focus:outline-none cursor-pointer"
                              >
                                <option value="全部已启用插件 (10)">全部已启用插件 (10)</option>
                                <option value="仅 Blender + CUA">仅 Blender + CUA</option>
                                <option value="只读场景检视">只读场景检视</option>
                              </select>
                              <ChevronDown className="w-3 h-3 text-[#71717a] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>

                            <MagpieToggle checked={ag.connected} onChange={() => toggleAgent(ag.id)} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 中间收起分割条 */}
                    <div className="py-3 flex items-center justify-center">
                      <button
                        onClick={() => setUnconnectedFolded(!unconnectedFolded)}
                        className="text-[12px] text-[#8b8b93] hover:text-[#f4f4f5] flex items-center gap-1 cursor-pointer"
                      >
                        <span>{unconnectedFolded ? `展开未接入 (${availableAgents.length})` : '收起'}</span>
                        {unconnectedFolded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* 未接入列表 */}
                    {!unconnectedFolded && availableAgents.length > 0 && (
                      <div>
                        <div className="text-[11.5px] text-[#63636b] mb-2">未接入</div>
                        <div className="border-t border-[#242429] divide-y divide-[#242429]">
                          {availableAgents.map((ag) => (
                            <div
                              key={ag.id}
                              onClick={() => setInspectedAgentId(ag.id)}
                              className="py-3 px-2.5 -mx-2.5 rounded-[8px] hover:bg-[#1c1c20] transition-colors flex items-center justify-between gap-4 cursor-pointer"
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                <div className="w-[28px] h-[28px] rounded-[6px] bg-[#1e1e22] border border-[#2a2a30] flex items-center justify-center text-[10.5px] font-mono text-[#8b8b93] shrink-0">
                                  {ag.mark}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[13.5px] font-medium text-[#d4d4d8]">{ag.name}</span>
                                    <span className="font-mono text-[11.5px] text-[#63636b]">{ag.version}</span>
                                  </div>
                                  <div className="mt-0.5 text-[12px] text-[#71717a] truncate">{ag.descUnconnected}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                                <span className="px-2.5 py-1 rounded-[6px] bg-[#1c1c20] border border-[#292930] text-[11.5px] text-[#8b8b93]">
                                  {ag.ingressMode}
                                </span>
                                <MagpieToggle checked={ag.connected} onChange={() => toggleAgent(ag.id)} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ==========================================================
                    VIEW 2: 插件与市场 (1:1 对齐用户提供的截图 2 & 3 设计结构)
                   ========================================================== */}
                {activeNav === 'plugins' && (
                  <div>
                    {/* 顶部大标题 + 右侧「浏览目录」与白色「添加 ▾」按钮 */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h1 className="text-[22px] font-semibold tracking-tight text-[#f4f4f5]">插件</h1>
                        <p className="text-[12.5px] text-[#8b8b93] mt-0.5">
                          管理插件、应用连接器、技能和 MCP
                        </p>
                      </div>

                      <div className="flex items-center gap-2 relative">
                        <button
                          onClick={() => setPluginSubTab('market')}
                          className="h-[30px] px-3 rounded-full bg-[#222227] hover:bg-[#2a2a30] border border-[#303037] text-[12px] text-[#e4e4e7] transition-colors cursor-pointer"
                        >
                          浏览目录
                        </button>
                        <button
                          onClick={() => setAddMenuOpen(!addMenuOpen)}
                          className="h-[30px] px-3.5 rounded-full bg-[#f4f4f5] hover:bg-white text-[#141416] text-[12px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>添加</span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>

                        {addMenuOpen && (
                          <div className="absolute right-0 top-9 w-[210px] bg-[#1e1e23] border border-[#2f2f37] rounded-[10px] p-1 shadow-xl z-20 text-[12px]">
                            <button
                              onClick={() => {
                                setAddMenuOpen(false);
                                setAddMarketModal(true);
                              }}
                              className="w-full px-3 py-2 rounded-[6px] text-left text-[#e4e4e7] hover:bg-[#292930] cursor-pointer"
                            >
                              挂载本地 marketplace.json
                            </button>
                            <button
                              onClick={() => {
                                setAddMenuOpen(false);
                                setWizardStep(1);
                                setBridgeWizardOpen(true);
                              }}
                              className="w-full px-3 py-2 rounded-[6px] text-left text-[#e4e4e7] hover:bg-[#292930] cursor-pointer"
                            >
                              扫描本机 DCC 软件桥接
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 五维分类计数胶囊 + 右侧圆角搜索框 (1:1 复刻截图 2 & 3) */}
                    <div className="mt-5 mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[
                          { id: 'plugins', label: '插件', count: 10 },
                          { id: 'apps', label: '应用', count: 16 },
                          { id: 'mcp', label: 'MCP', count: 4 },
                          { id: 'skills', label: '技能', count: 144 },
                          { id: 'market', label: '市场', count: marketplaces.length },
                        ].map((tab) => {
                          const active = pluginSubTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => setPluginSubTab(tab.id)}
                              className={`h-[28px] px-3 rounded-full text-[12px] flex items-center gap-1.5 transition-colors cursor-pointer ${
                                active
                                  ? 'bg-[#2a2a31] text-[#f4f4f5] font-medium'
                                  : 'text-[#8b8b93] hover:text-[#e4e4e7]'
                              }`}
                            >
                              <span>{tab.label}</span>
                              <span className="text-[#71717a] font-mono text-[11.5px]">{tab.count}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="relative w-full sm:w-[228px]">
                        <Search className="w-3.5 h-3.5 text-[#71717a] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={pluginSearch}
                          onChange={(e) => setPluginSearch(e.target.value)}
                          placeholder={pluginSubTab === 'market' ? '搜索市场' : '搜索插件'}
                          className="w-full h-[30px] pl-8 pr-3 rounded-full bg-[#1c1c20] border border-[#2c2c33] text-[12px] text-[#f4f4f5] placeholder-[#71717a] focus:outline-none focus:border-[#454550]"
                        />
                      </div>
                    </div>

                    {/* 当选中「市场」时：1:1 复刻截图 3 的 DCC-CUA marketplace.json 样式 */}
                    {pluginSubTab === 'market' ? (
                      <div className="border-t border-[#242429] divide-y divide-[#242429]">
                        {marketplaces.map((mkt) => (
                          <div
                            key={mkt.id}
                            className="py-4 flex items-center justify-between gap-4"
                          >
                            <div className="flex items-start gap-3.5 min-w-0">
                              <div className="w-[36px] h-[36px] rounded-[9px] bg-[#1e1e23] border border-[#2d2d35] flex items-center justify-center shrink-0 mt-0.5">
                                <Maximize2 className="w-4 h-4 text-[#a1a1aa]" />
                              </div>
                              <div className="min-w-0 space-y-0.5">
                                <div className="text-[13.5px] font-semibold text-[#f4f4f5]">{mkt.name}</div>
                                <div className="text-[12px] text-[#8b8b93]">{mkt.countText}</div>
                                <div className="text-[11.5px] font-mono text-[#71717a] break-all">{mkt.path}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                              <button
                                onClick={() =>
                                  setMarketplaces((prev) =>
                                    prev.map((m) => (m.id === mkt.id ? { ...m, hasUpgrade: false } : m))
                                  )
                                }
                                className="px-3 py-1 rounded-full bg-[#242429] hover:bg-[#2e2e35] border border-[#33333b] text-[12px] text-[#e4e4e7] cursor-pointer"
                              >
                                {mkt.hasUpgrade ? '升级' : '已最新'}
                              </button>
                              <button
                                onClick={() => setMarketplaces((prev) => prev.filter((m) => m.id !== mkt.id))}
                                className="p-1.5 text-[#71717a] hover:text-[#ef4444] transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* 插件 / 应用 / MCP / 技能 列表 (1:1 复刻截图 2 行结构：圆角方形图标 + 名称副标 + 描述 + 右侧开关 + >) */
                      <div className="border-t border-[#242429] divide-y divide-[#242429]">
                        {filteredEcoItems.map((item) => (
                          <div
                            key={item.id}
                            className="py-3.5 flex items-center justify-between gap-4 hover:bg-[#1a1a1e] px-2 -mx-2 rounded-[8px] transition-colors"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div
                                className="w-[34px] h-[34px] rounded-[9px] border border-[#2e2e36] flex items-center justify-center text-[11px] font-mono font-bold shrink-0"
                                style={{ backgroundColor: item.markBg, color: item.markColor }}
                              >
                                {item.mark}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[13.5px] font-medium text-[#f4f4f5]">{item.name}</span>
                                  <span className="text-[12px] text-[#71717a]">{item.subSlug}</span>
                                  <span className="px-1.5 py-0.2 rounded bg-[#202025] border border-[#2d2d34] font-mono text-[10.5px] text-[#a1a1aa]">
                                    {item.badge}
                                  </span>
                                </div>
                                <div className="text-[12px] text-[#8b8b93] truncate mt-0.5">{item.desc}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                              <code className="hidden lg:inline font-mono text-[11px] text-[#63636b] mr-1">
                                {item.cliPrefix}
                              </code>
                              <MagpieToggle checked={item.enabled} onChange={() => toggleEcosystemItem(item.id)} />
                              <ChevronRight className="w-4 h-4 text-[#52525b]" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ==========================================================
                    VIEW 3: 路由与拓扑 (完整展示 CLI Shim + MCP -> DCCMCP Server -> 原生 DCC)
                   ========================================================== */}
                {activeNav === 'topology' && (
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-[15px] font-medium text-[#f4f4f5]">
                          双入口同核拓扑（CLI Shim & MCP Bridge → DCCMCP Server → 原生软件连接器）
                        </h2>
                        <p className="text-[12px] text-[#8b8b93] mt-0.5">
                          终端内的短生命周期命令 <code className="font-mono text-[#d4d4d8]">dccmcp exec</code> 通过父进程嗅探与环境变量携带会话身份，与长连接 MCP 统一汇聚至本地 Server 进行多窗口锁调度与审计留痕。
                        </p>
                      </div>
                    </div>

                    <CircularHubRoutingGraph
                      lifecycleState={lifecycleState}
                      onSelectNode={() => setActiveNav('traces')}
                    />

                    {/* 三段连接机制对照说明卡片 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[12px]">
                      <div className="p-3.5 rounded-[8px] bg-[#1a1a1e] border border-[#26262c] space-y-1">
                        <div className="font-medium text-[#f4f4f5]">1. Agent 侧调用入口</div>
                        <div className="text-[#8b8b93] leading-relaxed">
                          主流 Agent 优先走 <code className="font-mono text-[#d4d4d8]">SKILL.md + dccmcp CLI</code> 按需加载工具；仅支持 MCP 的客户端走 3 元工具桥，彻底避免数百个 DCC API 塞爆上下文。
                        </div>
                      </div>
                      <div className="p-3.5 rounded-[8px] bg-[#1a1a1e] border border-[#26262c] space-y-1">
                        <div className="font-medium text-[#f4f4f5]">2. DCCMCP Server 统一留痕</div>
                        <div className="text-[#8b8b93] leading-relaxed">
                          监听 <code className="font-mono text-[#d4d4d8]">127.0.0.1:9765</code> 与 Unix Socket，为每次 CLI 调用生成唯一 TraceID，维护多窗口 PID 互斥锁并防止并发写坏工程文件。
                        </div>
                      </div>
                      <div className="p-3.5 rounded-[8px] bg-[#1a1a1e] border border-[#26262c] space-y-1">
                        <div className="font-medium text-[#f4f4f5]">3. 非 MCP 软件私有适配</div>
                        <div className="text-[#8b8b93] leading-relaxed">
                          向下按软件原生能力自动选择 Python Socket、Maya CommandPort、UE WebSocket 或免插件 <code className="font-mono text-[#d4d4d8]">dcc-cua</code> 窗口级控制。
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ==========================================================
                    VIEW 4: 软件与实例 (多窗口原生桥接状态与 PID 锁)
                   ========================================================== */}
                {activeNav === 'dcc' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[12.5px] text-[#8b8b93]">
                        当前已握手的本机创作软件窗口实例。同一软件打开多个场景时按独立窗口句柄/端口精准隔离路由。
                      </p>
                      <button
                        onClick={() => {
                          setWizardStep(1);
                          setBridgeWizardOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-[6px] bg-[#f4f4f5] text-[#141416] text-[12px] font-medium cursor-pointer"
                      >
                        + 扫描并注入软件桥
                      </button>
                    </div>

                    <div className="border-t border-[#242429] divide-y divide-[#242429]">
                      {dccInstances.map((inst) => {
                        const isFailedUe = inst.id === 'ue-01' && lifecycleState === 'failed';
                        const isRunningBl = inst.id === 'blender-01' && lifecycleState === 'running';
                        return (
                          <div key={inst.id} className="py-3.5 flex items-center justify-between gap-4">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                {isFailedUe ? (
                                  <X className="w-3.5 h-3.5 text-[#ef4444]" />
                                ) : (
                                  <StatusDot state={isRunningBl ? 'running' : 'connected'} />
                                )}
                                <span className="text-[13.5px] font-medium text-[#f4f4f5]">
                                  {inst.shortTitle} ({inst.windowTag})
                                </span>
                                <span className="px-2 py-0.5 rounded bg-[#202025] border border-[#2d2d34] font-mono text-[11px] text-[#d4d4d8]">
                                  {inst.protocol}
                                </span>
                                <span className="font-mono text-[11.5px] text-[#71717a]">
                                  {inst.endpoint} · PID {inst.pid}
                                </span>
                              </div>
                              <div className="text-[12px] font-mono text-[#8b8b93] truncate">
                                场景: {inst.path} · 桥接包: {inst.bridgePkg}
                              </div>
                            </div>

                            <div className="shrink-0 flex items-center gap-2">
                              {isFailedUe ? (
                                <button
                                  onClick={handleStartAutoDemo}
                                  className="px-2.5 py-1 rounded-[6px] bg-[#2a191b] border border-[#7f1d1d] text-[11.5px] text-[#fca5a5] cursor-pointer"
                                >
                                  重连 WebSocket
                                </button>
                              ) : (
                                <span className="px-2.5 py-1 rounded-[6px] bg-[#1e1e23] border border-[#2c2c33] font-mono text-[11px] text-[#a1a1aa]">
                                  --instance {inst.id}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ==========================================================
                    VIEW 5: 产物 (Artifacts) — 反向血缘溯源与 CLI 一键重放
                   ========================================================== */}
                {activeNav === 'artifacts' && (
                  <div className="space-y-4">
                    <p className="text-[12.5px] text-[#8b8b93]">
                      所有经 CLI 或 MCP 导出的模型、贴图与渲染帧均自动关联当时的调用命令行与目标 DCC 窗口快照，点击任意产物可检视完整血缘。
                    </p>

                    <div className="border-t border-[#242429] divide-y divide-[#242429]">
                      {artifacts.map((art) => (
                        <div
                          key={art.id}
                          onClick={() => setInspectedLineage(art)}
                          className="py-3.5 px-2.5 -mx-2.5 rounded-[8px] hover:bg-[#1c1c20] flex items-center justify-between gap-4 cursor-pointer transition-colors"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <StatusDot state="completed" />
                              <span className="text-[13.5px] font-mono font-medium text-[#f4f4f5]">{art.name}</span>
                              <span className="text-[11.5px] text-[#71717a]">{art.size}</span>
                            </div>
                            <div className="text-[12px] text-[#8b8b93] truncate">
                              {art.spec} · 由 <strong className="text-[#d4d4d8] font-normal">{art.agent}</strong> ({art.ingress}) 经{' '}
                              {art.targetDcc} 生成
                            </div>
                          </div>
                          <div className="text-right shrink-0 font-mono text-[11.5px] text-[#71717a]">
                            <div>{art.time}</div>
                            <div>{art.traceId}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ==========================================================
                    VIEW 6: 可观测 / 调用链路与日志 (统一记录 CLI 短命令与 MCP 会话)
                   ========================================================== */}
                {activeNav === 'traces' && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-[14.5px] font-medium text-[#f4f4f5]">
                          统一调用审计流（CLI Shim + MCP Bridge 实时汇合）
                        </h2>
                        <p className="text-[12px] text-[#8b8b93] mt-0.5">
                          每一条终端 CLI 命令均被自动捕获完整参数、父进程 Agent、目标软件协议耗时及视口现场快照。
                        </p>
                      </div>
                      {lifecycleState === 'failed' && (
                        <button
                          onClick={handleStartAutoDemo}
                          className="px-3 py-1.5 rounded-[6px] bg-[#f4f4f5] text-[#141416] text-[12px] font-medium flex items-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>从失败断点重试</span>
                        </button>
                      )}
                    </div>

                    <div className="bg-[#121214] border border-[#242429] rounded-[10px] divide-y divide-[#1e1e23]">
                      {liveFeedItems.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => setInspectedLineage(item)}
                          className="p-3.5 hover:bg-[#19191d] transition-colors cursor-pointer space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-[12.5px]">
                            <div className="flex items-center gap-2">
                              <StatusDot state={item.state} />
                              <span className="font-medium text-[#f4f4f5]">{item.agent}</span>
                              <span className="px-2 py-0.5 rounded bg-[#1d1d22] border border-[#2c2c33] font-mono text-[11px] text-[#d4d4d8]">
                                {item.pill}
                              </span>
                              <span className="font-mono text-[11px] text-[#71717a]">{item.protocol}</span>
                            </div>
                            <span className="font-mono text-[11.5px] text-[#8b8b93]">
                              {item.metrics} · {item.time}
                            </span>
                          </div>
                          <div className="font-mono text-[11.5px] text-[#9ca3af] bg-[#0e0e10] px-2.5 py-1.5 rounded border border-[#202025] truncate">
                            $ {item.cliCmd}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-[10px] bg-[#121214] border border-[#242429] space-y-2">
                        <div className="text-[12px] font-medium text-[#d4d4d8]">实时视口抓帧与异常现场</div>
                        <ViewportWireframePreview failed={lifecycleState === 'failed'} />
                      </div>
                      <div className="p-4 rounded-[10px] bg-[#121214] border border-[#242429] space-y-2 font-mono text-[11.5px]">
                        <div className="text-[12px] font-sans font-medium text-[#d4d4d8]">DCCMCP Server 实时守护日志</div>
                        <div className="space-y-1.5 text-[#9ca3af]">
                          <div>[15:49:40] INFO ingress.cli: parent_pid=41092 matched agent="Codex"</div>
                          <div>[15:49:41] INFO router.lock: acquired exclusive lock on blender-01 (:51231)</div>
                          {lifecycleState === 'failed' ? (
                            <div className="text-[#fca5a5]">
                              [15:49:44] ERR bridge.unreal: ws://127.0.0.1:51249 handshake timeout after 2 retries
                            </div>
                          ) : (
                            <div>
                              [15:49:44] OK bridge.blender: bake_pbr progress={runProgress}% · socket latency 2.1ms
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ==========================================================
                    VIEW 7: 服务网关 (DCCMCP Server & CLI Shim 系统级配置)
                   ========================================================== */}
                {activeNav === 'daemon' && (
                  <div className="space-y-4">
                    <p className="text-[12.5px] text-[#8b8b93]">
                      本地常驻网关服务负责把无状态的 CLI 命令与 MCP 请求归一化为有状态的实例队列与可观测记录。
                    </p>
                    <div className="border-t border-[#242429] divide-y divide-[#242429] text-[13px]">
                      <div className="py-3.5 flex items-center justify-between">
                        <div>
                          <div className="text-[#f4f4f5] font-medium">DCCMCP Server 本地监听端点</div>
                          <div className="text-[12px] text-[#8b8b93]">同时接收 HTTP REST、Unix Domain Socket 与 MCP SSE 转发</div>
                        </div>
                        <span className="font-mono text-[12px] text-[#e4e4e7]">127.0.0.1:9765</span>
                      </div>
                      <div className="py-3.5 flex items-center justify-between">
                        <div>
                          <div className="text-[#f4f4f5] font-medium">全局 CLI 转发器软链 (PATH Shim)</div>
                          <div className="text-[12px] text-[#8b8b93]">供 Claude Code / Codex / OpenCode 在任意工作目录直接调用</div>
                        </div>
                        <span className="font-mono text-[12px] text-[#a1a1aa]">~/.local/bin/dccmcp (已就绪)</span>
                      </div>
                      <div className="py-3.5 flex items-center justify-between">
                        <div>
                          <div className="text-[#f4f4f5] font-medium">CLI 父进程自动识别 (Parent-PID Sniffing)</div>
                          <div className="text-[12px] text-[#8b8b93]">即使未注入环境变量，也能识别调用源属于 Codex、Claude 还是手动终端</div>
                        </div>
                        <MagpieToggle checked onChange={() => {}} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </main>
          </div>

          {/* 右下角实时联动悬浮小窗口预览 (可在主窗口内直观看到托盘小窗同步跳动) */}
          {floatingTrayOpen && (
            <div className="hidden xl:block fixed right-5 bottom-4 z-30">
              <TrayMiniWindow
                isOverlay
                lifecycleState={lifecycleState}
                runProgress={runProgress}
                agents={agents}
                dccInstances={dccInstances}
                ecosystemItems={ecosystemItems}
                feedItems={liveFeedItems}
                onToggleAgent={toggleAgent}
                onOpenMain={(targetTab) => setActiveNav(targetTab || 'topology')}
                onSelectFeedItem={(item) => setInspectedLineage(item)}
                onRetryFailed={handleStartAutoDemo}
                onCloseOverlay={() => setFloatingTrayOpen(false)}
              />
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          抽屉 1: Agent 自动化注入详情检视 (查看注入的 SKILL.md / CLI Shim / MCP JSON)
         ==================================================================== */}
      {inspectedAgent && (
        <div
          className="fixed inset-0 z-50 bg-black/55 flex justify-end"
          onClick={() => setInspectedAgentId(null)}
        >
          <div
            className="w-full max-w-[440px] bg-[#161619] border-l border-[#292930] h-full p-6 flex flex-col justify-between overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-mono text-[#71717a]">AUTO-PROVISIONING INSPECTOR</div>
                  <h3 className="text-[16px] font-semibold text-[#f4f4f5] mt-1">
                    {inspectedAgent.name} 自动化连接明细
                  </h3>
                </div>
                <button
                  onClick={() => setInspectedAgentId(null)}
                  className="p-1 text-[#71717a] hover:text-[#f4f4f5] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-[12px]">
                <div className="text-[#8b8b93]">当前接入方式</div>
                <div className="px-3 py-2 rounded-[6px] bg-[#111113] border border-[#25252b] font-mono text-[#e4e4e7]">
                  {inspectedAgent.ingressMode}
                </div>
              </div>

              <div className="space-y-2 text-[12px]">
                <div className="text-[#8b8b93]">自动写入的宿主路径</div>
                <div className="px-3 py-2 rounded-[6px] bg-[#111113] border border-[#25252b] font-mono text-[11.5px] text-[#a1a1aa] break-all">
                  {inspectedAgent.configPath}
                </div>
              </div>

              <div className="space-y-2 text-[12px]">
                <div className="text-[#8b8b93]">
                  {inspectedAgent.ingressMode.includes('CLI')
                    ? '注入的按需引导 SKILL.md 预览（不撑爆上下文）'
                    : '注入的精简 MCP 元工具配置预览'}
                </div>
                <pre className="p-3 rounded-[6px] bg-[#111113] border border-[#25252b] font-mono text-[11px] text-[#a1a1aa] overflow-x-auto leading-relaxed">
                  {inspectedAgent.ingressMode.includes('CLI')
                    ? `---
name: dcc-mcp
description: Control Blender, Maya, UE5 & CUA windows
---
1. Discover live DCC windows:
   \`dccmcp instances --json\`
2. Inspect domain skill on-demand:
   \`dccmcp skill help blender\`
3. Execute deterministic action (logged by daemon):
   \`dccmcp exec <app> <action> --instance <id>\``
                    : `{
  "mcpServers": {
    "dccmcp": {
      "command": "dccmcp",
      "args": ["mcp-shim", "--meta-only"],
      "env": { "DCCMCP_CLIENT": "${inspectedAgent.id}" }
    }
  }
}`}
                </pre>
              </div>
            </div>

            <div className="pt-4 border-t border-[#25252b] flex items-center justify-between">
              <span className="text-[12px] text-[#8b8b93]">关闭开关将无损回滚原配置</span>
              <MagpieToggle
                checked={inspectedAgent.connected}
                onChange={() => toggleAgent(inspectedAgent.id)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          抽屉 2: 反向血缘与 CLI 命令重放检视器 (Artifact / Feed Item -> Server -> DCC)
         ==================================================================== */}
      {inspectedLineage && (
        <div
          className="fixed inset-0 z-50 bg-black/55 flex justify-end"
          onClick={() => setInspectedLineage(null)}
        >
          <div
            className="w-full max-w-[440px] bg-[#161619] border-l border-[#292930] h-full p-6 flex flex-col justify-between overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-mono text-[#71717a]">EXECUTION & LINEAGE RECORD</div>
                  <h3 className="text-[15px] font-semibold text-[#f4f4f5] mt-1">
                    {inspectedLineage.name || inspectedLineage.pill}
                  </h3>
                </div>
                <button
                  onClick={() => setInspectedLineage(null)}
                  className="p-1 text-[#71717a] hover:text-[#f4f4f5] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <ViewportWireframePreview failed={inspectedLineage.state === 'failed'} />

              <div className="p-3 rounded-[8px] bg-[#111113] border border-[#25252b] space-y-2 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-[#71717a]">触发 Agent</span>
                  <span className="font-mono text-[#f4f4f5]">{inspectedLineage.agent}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#71717a]">网关守护中心</span>
                  <span className="font-mono text-[#d4d4d8]">DCCMCP Server (:9765)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#71717a]">目标软件与协议</span>
                  <span className="font-mono text-[#d4d4d8]">{inspectedLineage.protocol}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11.5px] text-[#8b8b93]">完整记录的 CLI / Shim 命令（支持一键复现）</div>
                <pre className="p-3 rounded-[6px] bg-[#111113] border border-[#25252b] font-mono text-[11px] text-[#e4e4e7] whitespace-pre-wrap break-all">
                  $ {inspectedLineage.cliCmd}
                </pre>
              </div>
            </div>

            <div className="pt-4 border-t border-[#25252b] flex justify-end gap-2">
              <button
                onClick={() => {
                  setInspectedLineage(null);
                  handleStartAutoDemo();
                }}
                className="px-3.5 py-1.5 rounded-[6px] bg-[#f4f4f5] text-[#141416] text-[12px] font-medium cursor-pointer"
              >
                重放此命令
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          弹窗 1: Meshy 式三步本机 DCC 软件桥接自动装配向导
         ==================================================================== */}
      {bridgeWizardOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-[460px] bg-[#18181c] border border-[#2c2c34] rounded-[12px] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[14.5px] font-semibold text-[#f4f4f5]">本机 DCC 软件桥接自动装配</span>
              <button
                onClick={() => setBridgeWizardOpen(false)}
                className="text-[#71717a] hover:text-[#f4f4f5] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-[11.5px] font-mono text-[#71717a] border-b border-[#26262d] pb-2.5">
              <span className={wizardStep === 1 ? 'text-[#f4f4f5]' : ''}>01 扫描软件</span>
              <span>→</span>
              <span className={wizardStep === 2 ? 'text-[#f4f4f5]' : ''}>02 注入原生桥 / CUA</span>
              <span>→</span>
              <span className={wizardStep === 3 ? 'text-[#f4f4f5]' : ''}>03 握手验证</span>
            </div>

            {wizardStep === 1 && (
              <div className="space-y-2 text-[12px]">
                {[
                  { name: 'Blender 4.2', mode: 'Python Socket 插件自动注入' },
                  { name: 'Autodesk Maya 2025', mode: 'userSetup.py CommandPort 注入' },
                  { name: 'Maxon ZBrush 2026', mode: '无官方 SDK → 启用 dcc-cua 窗口绑定' },
                  { name: 'Unreal Engine 5.4', mode: 'RemoteControl WebSocket 启用' },
                ].map((row) => (
                  <div
                    key={row.name}
                    className="px-3 py-2 rounded-[7px] bg-[#121215] border border-[#24242b] flex items-center justify-between"
                  >
                    <span className="text-[#f4f4f5] font-medium">{row.name}</span>
                    <span className="text-[11px] font-mono text-[#9ca3af]">{row.mode}</span>
                  </div>
                ))}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="px-4 py-1.5 rounded-[7px] bg-[#f4f4f5] text-[#141416] font-medium cursor-pointer"
                  >
                    下一步
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-3 text-[12px]">
                <div className="p-3 rounded-[7px] bg-[#121215] border border-[#24242b] font-mono text-[11.5px] text-[#a1a1aa] space-y-1">
                  <div>✓ 写入 ~/.local/bin/dccmcp 全局 CLI 转发器</div>
                  <div>✓ 写入 Blender / Maya 启动桥接脚本（多窗口独立端口）</div>
                  <div>✓ 绑定 dcc-cua 免插件窗口句柄守护策略</div>
                </div>
                <div className="flex justify-between">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="px-3 py-1.5 rounded-[7px] bg-[#24242a] text-[#d4d4d8] cursor-pointer"
                  >
                    上一步
                  </button>
                  <button
                    onClick={() => setWizardStep(3)}
                    className="px-4 py-1.5 rounded-[7px] bg-[#f4f4f5] text-[#141416] font-medium cursor-pointer"
                  >
                    测试连通性
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div className="space-y-3 text-[12px]">
                <div className="py-2 flex items-center gap-2 text-[#e4e4e7]">
                  <StatusDot state="connected" />
                  <span>全部 4 个软件连接器与本地 DCC-MCP Gateway (:9765) 握手正常。</span>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setBridgeWizardOpen(false);
                      setLifecycleState('connected');
                    }}
                    className="px-4 py-1.5 rounded-[7px] bg-[#f4f4f5] text-[#141416] font-medium cursor-pointer"
                  >
                    完成
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          弹窗 2: 挂载本地或团队共享 marketplace.json 市场源
         ==================================================================== */}
      {addMarketModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddMarketplace}
            className="w-full max-w-[460px] bg-[#18181c] border border-[#2c2c34] rounded-[12px] p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-semibold text-[#f4f4f5]">添加插件市场源 (marketplace.json)</span>
              <button
                type="button"
                onClick={() => setAddMarketModal(false)}
                className="text-[#71717a] hover:text-[#f4f4f5] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              value={newMarketPath}
              onChange={(e) => setNewMarketPath(e.target.value)}
              className="w-full h-[34px] px-3 rounded-[7px] bg-[#111114] border border-[#2c2c34] font-mono text-[11.5px] text-[#f4f4f5] focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddMarketModal(false)}
                className="px-3 py-1.5 rounded-[7px] bg-[#24242a] text-[12px] text-[#d4d4d8] cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-[7px] bg-[#f4f4f5] text-[#141416] text-[12px] font-medium cursor-pointer"
              >
                添加市场
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
