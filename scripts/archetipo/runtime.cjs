// Only synthetic, checkout-owned PostgreSQL. Never reads credentials from .env.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync, spawn } = require('node:child_process');
const root = process.cwd();
const work = path.join(root, '.archetipo/environment/runtime');
const image = 'postgres:16.6-alpine@sha256:1d04b9ba1d4996401f2552b51beda8187f175c0645c091e4781134fc9c9a3eef';
const stateFile = path.join(root, '.archetipo/environment/rideatlas-local.json');
const volumeName = `rideatlas-data-${crypto.createHash('sha256').update(root + ':postgres').digest('hex').slice(0, 20)}`;
const action = process.argv[2];
function run(argv, env = process.env, capture = false, cwd = fs.existsSync(work) ? work : root) {
  const r = spawnSync(argv[0], argv.slice(1), { cwd, env, encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit', timeout: 1700000 });
  if (r.error || r.status !== 0) throw new Error(`Command failed: ${argv[0]} ${argv[1]} (${r.status}): ${r.error?.message || (capture ? r.stderr : '')}`);
  return capture ? r.stdout.trim() : '';
}
function identity() {
  const owner = process.env.ARCHETIPO_RESOURCE_OWNER;
  const resource = process.env.ARCHETIPO_RESOURCE_NAME;
  if (!owner || resource !== 'postgres') throw new Error('Missing resource owner or unexpected resource name');
  const key = crypto.createHash('sha256').update(root + owner + resource).digest('hex').slice(0, 20);
  return { owner, resource, name: `rideatlas-${key}`, root };
}
function inspect(id) {
  run(['docker', 'info', '--format', '{{.ServerVersion}}'], process.env, true);
  const names = run(['docker', 'container', 'ls', '-a', '--format', '{{.Names}}'], process.env, true).split('\n');
  if (!names.includes(id.name)) return null;
  const c = JSON.parse(run(['docker', 'inspect', id.name], process.env, true))[0];
  const l = c.Config.Labels;
  if (l['archetipo.owner'] !== id.owner || l['archetipo.resource'] !== id.resource || l['archetipo.checkout'] !== root || c.Config.Image !== image) throw new Error('Resource ownership/image mismatch');
  if (!c.Mounts.some(m => m.Type === 'volume' && m.Name === volumeName && m.Destination === '/var/lib/postgresql/data')) throw new Error('Persistent data volume mismatch');
  volume(false);
  return c;
}
function volume(create) {
  const names = run(['docker', 'volume', 'ls', '--format', '{{.Name}}'], process.env, true).split('\n');
  if (!names.includes(volumeName)) {
    if (!create) throw new Error('Persistent data volume is missing');
    run(['docker', 'volume', 'create', '--label', `archetipo.checkout=${root}`, '--label', 'archetipo.resource=postgres', '--label', 'archetipo.dataset=rideatlas-synthetic-v1', volumeName]);
  }
  const v = JSON.parse(run(['docker', 'volume', 'inspect', volumeName], process.env, true))[0];
  if (v.Labels?.['archetipo.checkout'] !== root || v.Labels?.['archetipo.resource'] !== 'postgres' || v.Labels?.['archetipo.dataset'] !== 'rideatlas-synthetic-v1') throw new Error('Persistent volume ownership mismatch');
}
function endpoint(c, port) {
  const binding = c.HostConfig.PortBindings['5432/tcp'];
  if (binding?.length !== 1 || binding[0].HostIp !== '127.0.0.1' || binding[0].HostPort !== String(port)) throw new Error('Resource endpoint mismatch');
}
function state() {
  const s = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  if (s.root !== root) throw new Error('Wrong checkout state');
  const c = inspect(s); if (!c || !c.State.Running) throw new Error('Owned database is not running');
  endpoint(c, s.port);
  return s;
}
function env(s, port = 3000) {
  const e = { ...process.env };
  // Prevent Next/Jest/Prisma from inheriting credentials in this checkout's env files.
  for (const f of fs.readdirSync(root).filter(n => /^\.env($|\.)/.test(n))) {
    for (const line of fs.readFileSync(path.join(root, f), 'utf8').split('\n')) {
      const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/); if (m) e[m[1]] = '';
    }
  }
  for (const k of Object.keys(e)) if (/^(AWS_|SMTP_|GOOGLE_|STRIPE_|NEXT_PUBLIC_STRIPE_|BLOB_)/.test(k)) e[k] = '';
  return { ...e, DATABASE_URL: `postgresql://archetipo:archetipo-local-only@127.0.0.1:${s.port}/rideatlas`, NEXTAUTH_URL: `http://127.0.0.1:${port}`, AUTH_URL: `http://127.0.0.1:${port}`, NEXTAUTH_SECRET: crypto.createHash('sha256').update(s.owner + root).digest('hex'), AUTH_TRUST_HOST: 'true', NEXT_TELEMETRY_DISABLED: '1', NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_archetipo_unconfigured', NODE_ENV: 'development' };
}
async function main() {
  if (['start', 'probe', 'stop', 'stopped'].includes(action)) {
    const id = identity(); let c = inspect(id);
    const port = process.env.ARCHETIPO_PORT_DATABASE;
    if (!/^\d+$/.test(port || '')) throw new Error('Missing assigned DATABASE port');
    if (c) endpoint(c, port);
    if (action === 'stopped') { if (c?.State.Running) throw new Error('Database still running'); return; }
    if (action === 'stop') { if (c?.State.Running) run(['docker', 'stop', '--time', '10', id.name]); return; }
    if (action === 'start') {
      volume(true);
      const active = run(['docker', 'ps', '--filter', `volume=${volumeName}`, '--format', '{{.Names}}'], process.env, true).split('\n').filter(Boolean);
      if (active.some(name => name !== id.name)) throw new Error('Persistent volume already belongs to another running resource; stop its registered owner first');
      if (!c) {
        run(['docker', 'run', '-d', '--name', id.name, '--label', `archetipo.owner=${id.owner}`, '--label', `archetipo.resource=${id.resource}`, '--label', `archetipo.checkout=${root}`, '--mount', `type=volume,source=${volumeName},target=/var/lib/postgresql/data`, '-p', `127.0.0.1:${port}:5432`, '-e', 'POSTGRES_USER=archetipo', '-e', 'POSTGRES_PASSWORD=archetipo-local-only', '-e', 'POSTGRES_DB=rideatlas', image]);
      } else if (!c.State.Running) run(['docker', 'start', id.name]);
      fs.mkdirSync(path.dirname(stateFile), { recursive: true });
      fs.writeFileSync(stateFile, JSON.stringify({ ...id, port }), { mode: 0o600 });
    }
    for (let n = 0; n < 20; n++) {
      c = inspect(id); endpoint(c, port);
      const r = spawnSync('docker', ['exec', id.name, 'pg_isready', '-U', 'archetipo', '-d', 'rideatlas'], { stdio: 'pipe' });
      if (c.State.Running && r.status === 0) { console.log('Owned PostgreSQL endpoint ready'); return; }
      await new Promise(r => setTimeout(r, 500));
    }
    throw new Error('PostgreSQL readiness timed out');
  }
  const s = state(); const e = env(s);
  if (action === 'install') {
    const marker = path.join(work, 'archetipo-owner.json');
    if (fs.existsSync(work) && (!fs.existsSync(marker) || JSON.parse(fs.readFileSync(marker)).root !== root)) throw new Error('Runtime directory is not owned by this checkout');
    fs.mkdirSync(work, { recursive: true });
    fs.writeFileSync(marker, JSON.stringify({ root }));
    for (const file of ['src', 'public', 'prisma', 'package.json', 'package-lock.json', 'next.config.js', 'next-env.d.ts', 'tsconfig.json', 'eslint.config.mjs', 'jest.config.js', 'tailwind.config.js', 'postcss.config.js']) {
      const target = path.join(work, file);
      if (fs.existsSync(target)) fs.rmSync(target, { recursive: true });
      fs.cpSync(path.join(root, file), target, { recursive: true });
    }
    const lockHash = crypto.createHash('sha256').update(fs.readFileSync('package-lock.json')).digest('hex');
    const stamp = path.join(work, 'installed-lock.sha256');
    if (!fs.existsSync(stamp) || fs.readFileSync(stamp, 'utf8') !== lockHash) {
      run(['npm', 'ci', '--ignore-scripts', '--no-audit', '--no-fund'], e);
      fs.writeFileSync(stamp, lockHash);
    }
    const dir = fs.realpathSync(path.join(work, 'node_modules'));
    if (!dir.startsWith(work + path.sep)) throw new Error('Dependencies belong to another checkout');
    const locked = JSON.parse(fs.readFileSync('package-lock.json', 'utf8')).packages;
    for (const [location, pkg] of Object.entries(locked)) {
      if (!location || !pkg.version || pkg.optional) continue;
      const installed = JSON.parse(fs.readFileSync(path.join(work, location, 'package.json'), 'utf8'));
      if (installed.version !== pkg.version) throw new Error(`Installed dependency differs from lockfile: ${location}`);
    }
    // Installation is verified separately in a pristine owned scratch directory.
    run(['npm', 'ls', '--depth=0'], e);
    run(['node', 'node_modules/prisma/build/index.js', 'generate'], e);
    return;
  }
  if (action === 'schema') {
    run(['node', 'node_modules/prisma/build/index.js', 'db', 'push', '--skip-generate'], e);
    Object.assign(process.env, e);
    const { PrismaClient } = require(path.join(work, 'node_modules/@prisma/client'));
    const p = new PrismaClient();
    try {
      await p.user.upsert({ where: { email: 'environment@rideatlas.invalid' }, update: {}, create: { id: 'archetipo-environment-fixture', email: 'environment@rideatlas.invalid', name: 'Fixture ambiente', role: 'Explorer' } });
    } finally { await p.$disconnect(); }
    return;
  }
  if (action === 'ready') {
    Object.assign(process.env, e);
    const { PrismaClient, Prisma } = require(path.join(work, 'node_modules/@prisma/client'));
    const p = new PrismaClient();
    try {
      for (const model of Prisma.dmmf.datamodel.models) await p[model.name[0].toLowerCase() + model.name.slice(1)].findFirst();
      const row = await p.user.findUniqueOrThrow({ where: { email: 'environment@rideatlas.invalid' } });
      if (row.id !== 'archetipo-environment-fixture') throw new Error('Fixture identity mismatch');
      console.log('Generated Prisma client, all model columns and persistent fixture verified');
    } finally { await p.$disconnect(); }
    return;
  }
  if (action === 'build') {
    const target = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'rideatlas-build-'));
    for (const file of ['src', 'public', 'prisma', 'package.json', 'package-lock.json', 'next.config.js', 'next-env.d.ts', 'tsconfig.json', 'eslint.config.mjs', 'tailwind.config.js', 'postcss.config.js']) {
      fs.cpSync(path.join(work, file), path.join(target, file), { recursive: true });
    }
    fs.symlinkSync(path.join(work, 'node_modules'), path.join(target, 'node_modules'), 'dir');
    console.log(`Owned isolated build output: ${target}`);
    e.NODE_ENV = 'production';
    run(['npm', 'run', 'build'], e, false, target);
    return;
  }
  const commands = {
    lint: ['npm', 'run', 'lint'],
    types: ['node', 'node_modules/typescript/bin/tsc', '--noEmit', '--incremental', 'false'],
    tests: ['npm', 'run', 'test:ci', '--', '--runInBand', '--cacheDirectory=.archetipo/environment/jest-cache'],
    build: ['npm', 'run', 'build'],
  };
  if (commands[action]) { if (action === 'build') e.NODE_ENV = 'production'; run(commands[action], e); return; }
  if (action === 'preview') {
    const port = process.argv[3]; if (!/^\d+$/.test(port || '')) throw new Error('Missing preview port');
    const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', port], { cwd: work, env: env(s, port), stdio: 'inherit' });
    for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
    child.on('exit', code => process.exit(code ?? 1)); return;
  }
  throw new Error(`Unknown operation: ${action}`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
