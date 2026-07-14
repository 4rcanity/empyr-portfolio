import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const risaleDir = process.env.RISALE_DIR || resolve(root, '..', 'risale-i-nur');
const portfolioDist = resolve(root, 'dist');
const risaleDist = resolve(risaleDir, 'dist');

function run(cmd, cwd, env = {}) {
  execSync(cmd, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
}

console.log('Building Empyr portfolio…');
run('npm run build', root);

if (!existsSync(risaleDir)) {
  console.warn(`Risale-i Nur not found at ${risaleDir} — skipping /risale/ bundle.`);
  process.exit(0);
}

console.log(`Building Risale-i Nur from ${risaleDir}…`);
if (!existsSync(resolve(risaleDir, 'node_modules'))) {
  run('npm ci', risaleDir);
}
run('npm run build', risaleDir, {
  ASTRO_BASE: '/risale/',
  ASTRO_SITE: 'https://empyr-portfolio.com',
});

const target = resolve(portfolioDist, 'risale');
rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(risaleDist, target, { recursive: true });

console.log('Combined build ready in dist/ (portfolio + /risale/).');
