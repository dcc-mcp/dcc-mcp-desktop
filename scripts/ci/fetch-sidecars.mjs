import { createHash } from 'node:crypto';
import { chmod, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const configPath = path.join(root, 'config', 'sidecars.json');
const outputDir = path.join(root, 'src-tauri', 'binaries');
const target = process.argv[2] ?? process.env.TARGET_TRIPLE;

if (!target) {
  throw new Error('usage: node scripts/ci/fetch-sidecars.mjs <target-triple>');
}

const config = JSON.parse(await readFile(configPath, 'utf8'));
await mkdir(outputDir, { recursive: true });

for (const binary of config.binaries) {
  const descriptor = binary.targets[target];
  if (!descriptor) {
    throw new Error(`no ${binary.name} sidecar configured for ${target}`);
  }
  const url = `https://github.com/${config.repository}/releases/download/${config.releaseTag}/${descriptor.asset}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`failed to download ${url}: HTTP ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const hash = createHash('sha256').update(buffer).digest('hex');
  if (hash !== descriptor.sha256) {
    throw new Error(`${descriptor.asset} checksum mismatch: expected ${descriptor.sha256}, got ${hash}`);
  }
  const extension = target.includes('windows') ? '.exe' : '';
  const destination = path.join(outputDir, `${binary.name}-${target}${extension}`);
  const temporary = `${destination}.download`;
  await writeFile(temporary, buffer);
  if (!target.includes('windows')) {
    await chmod(temporary, 0o755);
  }
  await rename(temporary, destination);
  console.log(`prepared ${path.relative(root, destination)}`);
}

