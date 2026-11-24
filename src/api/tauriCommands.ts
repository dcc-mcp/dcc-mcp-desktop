import { invoke } from '@tauri-apps/api/core';
import type { DetectedAgent, IngressMode, ProvisionResult } from '../types/agent';
import type { GatewayHealth } from '../types/gateway';
import type { MarketplaceSource } from '../types/marketplace';

export const getGatewayStatus = () => invoke<GatewayHealth>('get_gateway_status');

export const switchGatewayProfile = (profileId: string) =>
  invoke<void>('switch_gateway_profile', { profileId });

export const scanLocalAgents = () => invoke<DetectedAgent[]>('scan_local_agents');

export const provisionAgent = (agentId: string, mode: IngressMode, enabled: boolean) =>
  invoke<ProvisionResult>('provision_agent', { agentId, mode, enabled });

export const scanDccInstallations = () => invoke<unknown[]>('scan_dcc_installations');

export const installDccBridge = (dccId: string) =>
  invoke<void>('install_dcc_bridge', { dccId });

export const listMarketplaceSources = () =>
  invoke<MarketplaceSource[]>('list_marketplace_sources');

export const syncMarketplaceSource = (sourceId: string) =>
  invoke<void>('sync_marketplace_source', { sourceId });

export const openMainWindow = (route?: string) =>
  invoke<void>('open_main_window', { route: route ?? null });

export const quitApp = () => invoke<void>('quit_app');
