import { spawnSync } from 'node:child_process';
import path from 'node:path';

const command = process.argv[2];
const args = process.argv.slice(3);
if (!command) {
  throw new Error('usage: node scripts/ci/node-env.mjs <command> [args...]');
}

const nodeExecutable = process.execPath;
const nodeDir = path.dirname(nodeExecutable);

const isNpm = command === 'npm';
const npmCli = path.join(nodeDir, 'node_modules', 'npm', 'bin', 'npm-cli.js');
const spawnCommand = isNpm ? nodeExecutable : command;
const spawnArgs = isNpm ? [npmCli, ...args] : args;
const pathSeparator = process.platform === 'win32' ? ';' : ':';
const result = spawnSync(spawnCommand, spawnArgs, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: {
    Path: [
      nodeDir,
      path.join(process.cwd(), 'node_modules', '.bin'),
      process.env.Path ?? process.env.PATH ?? '',
    ].join(pathSeparator),
    PATH: [
      nodeDir,
      path.join(process.cwd(), 'node_modules', '.bin'),
      process.env.PATH ?? '',
    ].join(pathSeparator),
  },
});
if (result.error) {
  throw result.error;
}
process.exit(result.status ?? 1);
