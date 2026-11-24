import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const read = async (relative) => readFile(path.join(root, relative), 'utf8');

test('external sidecars are declared in the Tauri bundle', async () => {
  const config = JSON.parse(await read('src-tauri/tauri.conf.json'));
  assert.deepEqual(config.bundle.externalBin, [
    'binaries/dcc-mcp-server',
    'binaries/dcc-mcp-cli',
  ]);
});

test('configured target triples map to the pinned core release', async () => {
  const config = JSON.parse(await read('config/sidecars.json'));
  assert.equal(config.releaseTag, 'v0.20.53');
  const expected = [
    'x86_64-pc-windows-msvc',
    'aarch64-apple-darwin',
    'x86_64-apple-darwin',
    'x86_64-unknown-linux-gnu',
  ];
  for (const binary of config.binaries) {
    assert.deepEqual(Object.keys(binary.targets), expected);
    for (const descriptor of Object.values(binary.targets)) {
      assert.match(descriptor.sha256, /^[0-9a-f]{64}$/);
    }
  }
});

test('frontend no longer contains mock gateway traffic', async () => {
  const store = await read('src/stores/useGatewayStore.ts');
  assert.doesNotMatch(store, /mock_|startMockEvents/);
});
