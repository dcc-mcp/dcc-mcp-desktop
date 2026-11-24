import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import path from 'node:path';

for (let attempt = 1; attempt <= 3; attempt += 1) {
  const result = spawnSync('vx', ['npm', 'ci', '--ignore-scripts'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      PATH: `${path.dirname(process.execPath)}${process.platform === 'win32' ? ';' : ':'}${process.env.PATH ?? ''}`,
    },
  });
  if (result.status === 0) {
    process.exit(0);
  }
  if (attempt === 3) {
    process.exit(result.status ?? 1);
  }
  rmSync(path.join(process.cwd(), 'node_modules'), { recursive: true, force: true });
}
