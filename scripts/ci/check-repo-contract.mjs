import { execFileSync } from 'node:child_process';

const run = (args) =>
  execFileSync('vx', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    .split(/\r?\n/)
    .filter(Boolean);

const rootFiles = run(['git', 'ls-files']).filter((entry) => !entry.includes('/'));
const allowed = new Set([
  'AGENTS.md',
  'CLAUDE.md',
  'GEMINI.md',
  '.cursorrules',
  '.windsurfrules',
  '.clinerules',
  'vx.toml',
  'vx.lock',
  'justfile',
  'rust-toolchain.toml',
  'Cargo.toml',
  'Cargo.lock',
  'package.json',
  'package-lock.json',
  'pyproject.toml',
  '.pre-commit-config.yaml',
  '.typos.toml',
  'clippy.toml',
  '.editorconfig',
  'renovate.json',
  'codecov.yml',
  'release-please-config.json',
  '.release-please-manifest.json',
  'CHANGELOG.md',
  'README.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'CODE_OF_CONDUCT.md',
  'LICENSE',
  'NOTICE',
  'TRADEMARKS.md',
  'llms.txt',
  'llms-full.txt',
  'Dockerfile',
  'action.yml',
  'distribution.toml',
  'Cross.toml',
  '.gitattributes',
  '.gitignore',
  '.gitmessage',
  '.gitmodules',
  'index.html',
  'postcss.config.cjs',
  'tailwind.config.ts',
  'tray.html',
  'tsconfig.json',
  'vite.config.ts',
]);
const allowedPatterns = [
  /^README_.+\.md$/i,
  /^install.+\.(sh|ps1)$/i,
];
const violations = rootFiles.filter((file) => !allowed.has(file) && !allowedPatterns.some((pattern) => pattern.test(file)));
if (violations.length > 0) {
  console.error(`disallowed root files: ${violations.join(', ')}`);
  process.exit(1);
}

const justfiles = run(['git', 'ls-files']).filter((entry) => /^\.?justfile$/i.test(entry));
if (justfiles.length !== 1 || justfiles[0] !== 'justfile') {
  console.error(`expected exactly one lowercase justfile, found: ${justfiles.join(', ') || 'none'}`);
  process.exit(1);
}

let vxToml = '';
try {
  vxToml = execFileSync('vx', ['git', 'show', 'HEAD:vx.toml'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
} catch {
  vxToml = execFileSync('vx', ['git', 'show', ':vx.toml'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}
if (/^\[scripts\]/m.test(vxToml)) {
  console.error('vx.toml must not define [scripts] when justfile exists');
  process.exit(1);
}

const artifacts = run(['git', 'ls-files']).filter((entry) =>
  /(^|\/)([^/]*\.(log|tmp|out|o|pyc)|coverage\.json|audit-result\.json)$|^(target|dist|build)\//i.test(entry),
);
if (artifacts.length > 0) {
  console.error(`tracked build artifacts: ${artifacts.join(', ')}`);
  process.exit(1);
}

console.log('repository contract ok');
