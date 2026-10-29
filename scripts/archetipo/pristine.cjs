const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const target = fs.mkdtempSync(path.join(os.tmpdir(), 'rideatlas-pristine-'));
for (const file of ['package.json', 'package-lock.json']) fs.copyFileSync(file, path.join(target, file));
fs.mkdirSync(path.join(target, 'prisma'));
fs.copyFileSync('prisma/schema.prisma', path.join(target, 'prisma/schema.prisma'));
console.log(`Owned pristine installation: ${target}`);
for (const argv of [['npm', 'ci', '--ignore-scripts', '--no-audit', '--no-fund'], ['node', 'node_modules/prisma/build/index.js', 'generate']]) {
  const result = spawnSync(argv[0], argv.slice(1), { cwd: target, stdio: 'inherit', timeout: 600000, env: { ...process.env, DATABASE_URL: 'postgresql://archetipo:archetipo-local-only@127.0.0.1:1/rideatlas' } });
  if (result.error || result.status !== 0) { console.error(result.error?.message || `Failed with status ${result.status}`); process.exit(result.status || 1); }
}
console.log('Locked pristine install and Prisma generation passed; original installation preserved.');
