import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const platform = process.argv[2] ?? process.platform;
const target = process.argv[3];
const bundleDir = path.join(
  root,
  'src-tauri',
  'target',
  ...(target ? [target] : []),
  'release',
  'bundle',
);
const patterns = {
  win32: [/\.msi$/i, /\.exe$/i],
  darwin: [/\.dmg$/i],
  linux: [/\.AppImage$/i, /\.deb$/i],
};
if (!patterns[platform]) {
  throw new Error(`unsupported bundle platform: ${platform}`);
}

const files = (await readdir(bundleDir, { recursive: true })).filter((entry) =>
  patterns[platform].some((pattern) => pattern.test(entry)),
);
if (files.length < patterns[platform].length) {
  throw new Error(`expected ${patterns[platform].length} bundle formats for ${platform}, found ${files.length}`);
}
for (const file of files) {
  const details = await stat(path.join(bundleDir, file));
  if (details.size === 0) {
    throw new Error(`empty bundle: ${file}`);
  }
  console.log(`verified ${file} (${details.size} bytes)`);
}
