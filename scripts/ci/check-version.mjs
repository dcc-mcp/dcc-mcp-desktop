import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = async (relative) => JSON.parse(await readFile(path.join(root, relative), 'utf8'));
const packageJson = await read('package.json');
const tauriConfig = await read('src-tauri/tauri.conf.json');
const cargo = await readFile(path.join(root, 'src-tauri', 'Cargo.toml'), 'utf8');
const cargoVersion = cargo.match(/^version\s*=\s*"([^"]+)"/m)?.[1];
const expected = process.argv[2];

const versions = {
  'package.json': packageJson.version,
  'Cargo.toml': cargoVersion,
  'tauri.conf.json': tauriConfig.version,
};
const unique = new Set(Object.values(versions));
if (unique.size !== 1 || (expected && !unique.has(expected))) {
  console.error(JSON.stringify({ versions, expected }, null, 2));
  process.exit(1);
}
console.log(`version contract ok: ${[...unique][0]}`);
