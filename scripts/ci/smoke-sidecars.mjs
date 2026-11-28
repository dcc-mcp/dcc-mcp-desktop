import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const target = process.argv[2];
const { binaries } = JSON.parse(await readFile('config/sidecars.json', 'utf8'));
for (const binary of binaries) {
  assert.ok(binary.targets[target], `unknown target ${target} for ${binary.name}`);
  const suffix = target.includes('windows') ? '.exe' : '';
  const executable = path.resolve('src-tauri/binaries', `${binary.name}-${target}${suffix}`);
  const version = execFileSync(executable, ['--version'], {
    encoding: 'utf8',
    timeout: 20000,
    env: { ...process.env, DCC_MCP_CLI_NO_UPDATE_MAINTENANCE: 'true', DCC_MCP_CLI_AUTO_UPDATE: 'false' },
  }).trim();
  assert.equal(version.split(/\s+/).at(-1), binary.releaseTag.slice(1), version);
  console.log(version);
}
