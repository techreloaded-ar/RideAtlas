#!/usr/bin/env node
// ARchetipo environment helper for RideAtlas (non-secret, checkout-local).
//
// The PostgreSQL database is a declared ARchetipo service owned by this checkout;
// its connection arrives as DATABASE_URL. This helper never starts containers,
// never reads credentials from env files and never writes to a database before
// verifying that the application's effective target is that owned service.
//
// Operations: install | target | schema | ready | quality | build | persistence | preview <port>
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');

const root = process.cwd();
const stateDir = path.join(root, '.archetipo', 'environment');
const isWin = process.platform === 'win32';
const EXPECTED_DB = 'rideatlas';
const EXPECTED_USER = 'rideatlas';
const FIXTURE_EMAIL = 'environment@rideatlas.invalid';
const FIXTURE_ID = 'archetipo-environment-fixture';
const DEMO_EMAIL = 'ranger.demo@rideatlas.invalid';
const DEMO_PASSWORD = 'RideAtlasDemo1'; // synthetic, local-only demo login; not a credential for any real service
const PERSISTENCE_EMAIL = 'persistence-check@rideatlas.invalid';
// Integrations whose credentials must never leak from the harness into this checkout.
const EXTERNAL_KEYS = /^(AWS_|SMTP_|GOOGLE_|STRIPE_|NEXT_PUBLIC_STRIPE_|BLOB_|OPENROUTER_|CLEANUP_TOKEN$)/;

function fail(message) { throw new Error(message); }
function bin(rel) { return path.join(root, 'node_modules', rel); }

function run(argv, env, opts = {}) {
  const cmd = isWin && argv[0] === 'npm' ? 'npm.cmd' : argv[0];
  const r = spawnSync(cmd, argv.slice(1), { cwd: root, env, stdio: 'inherit', shell: isWin && argv[0] === 'npm', timeout: opts.timeout || 1500000 });
  if (r.error || r.status !== 0) fail(`Command failed (${r.status ?? r.signal}): ${argv.join(' ')} ${r.error ? r.error.message : ''}`);
}

function serviceUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) fail('DATABASE_URL from the owned "db" service is missing: the service declaration was not applied');
  let u;
  try { u = new URL(raw); } catch { fail('DATABASE_URL from the owned service is not a valid URL'); }
  if (!/^postgres(ql)?:$/.test(u.protocol)) fail('Owned DATABASE_URL is not PostgreSQL');
  if (!['127.0.0.1', 'localhost', '[::1]', '::1'].includes(u.hostname)) fail(`Owned DATABASE_URL host is not loopback: ${u.hostname}`);
  if (decodeURIComponent(u.pathname.slice(1)) !== EXPECTED_DB || decodeURIComponent(u.username) !== EXPECTED_USER) fail('Owned DATABASE_URL does not name the declared rideatlas database/user');
  return raw;
}

// Environment for every project command: owned DB, derived local URLs, no external credentials.
function projectEnv(port) {
  const e = { ...process.env };
  for (const k of Object.keys(e)) if (EXTERNAL_KEYS.test(k)) delete e[k];
  const appUrl = `http://127.0.0.1:${port || 3000}`;
  return {
    ...e,
    DATABASE_URL: serviceUrl(),
    NEXTAUTH_URL: appUrl,
    AUTH_URL: appUrl,
    NEXTAUTH_SECRET: crypto.createHash('sha256').update(`rideatlas-local:${root}`).digest('hex'),
    AUTH_TRUST_HOST: 'true',
    NEXT_TELEMETRY_DISABLED: '1',
    CHECKPOINT_DISABLE: '1', // no Prisma update/telemetry calls
    STORAGE_PROVIDER: 'vercel-blob',
    // Email stays simulated (no SMTP_*); Stripe and storage are unconfigured locally.
  };
}

// Resolve the DATABASE_URL exactly as Next.js and Prisma will (process env wins over .env files).
function resolvedAppTarget(env) {
  const saved = { ...process.env };
  try {
    for (const k of Object.keys(process.env)) delete process.env[k];
    Object.assign(process.env, env);
    const { loadEnvConfig } = require(bin('@next/env'));
    loadEnvConfig(root, true, { info() {}, error() {} }, true);
    const nextUrl = process.env.DATABASE_URL;
    return nextUrl;
  } finally {
    for (const k of Object.keys(process.env)) delete process.env[k];
    Object.assign(process.env, saved);
  }
}

function prismaClient(env) {
  const { PrismaClient } = require(bin('@prisma/client'));
  return new PrismaClient({ datasources: { db: { url: env.DATABASE_URL } } });
}

async function verifyTarget(env, { claim }) {
  const appUrl = resolvedAppTarget(env);
  if (appUrl !== env.DATABASE_URL) fail('The application resolves a DATABASE_URL different from the owned service (check .env files / overrides)');
  for (const f of ['.env', 'prisma/.env']) {
    if (fs.existsSync(path.join(root, f))) console.log(`note: ${f} exists; process environment keeps precedence for DATABASE_URL`);
  }
  const p = prismaClient(env);
  try {
    const [id] = await p.$queryRawUnsafe(`select current_database() as db, current_user as usr, version() as version`);
    if (id.db !== EXPECTED_DB || id.usr !== EXPECTED_USER) fail(`Unexpected database identity ${id.db}/${id.usr}`);
    const [{ marker }] = await p.$queryRawUnsafe(`select to_regclass('archetipo.checkout_owner')::text as marker`);
    if (marker) {
      const rows = await p.$queryRawUnsafe(`select checkout from archetipo.checkout_owner`);
      if (rows.length !== 1 || rows[0].checkout !== root) fail(`Database is owned by another checkout: ${rows.map(r => r.checkout).join(', ')}`);
      console.log(`Owned database verified: ${id.db} as ${id.usr} for ${root}`);
      return;
    }
    const [{ n }] = await p.$queryRawUnsafe(`select count(*)::int as n from information_schema.tables where table_schema not in ('pg_catalog','information_schema')`);
    if (n !== 0) fail(`Database has ${n} tables but no ownership marker: refusing to adopt an unexpected existing database`);
    if (!claim) fail('Owned database has no ownership marker yet; run preparation');
    await p.$executeRawUnsafe(`create schema if not exists archetipo`);
    await p.$executeRawUnsafe(`create table if not exists archetipo.checkout_owner (checkout text primary key, claimed_at timestamptz not null default now())`);
    await p.$executeRawUnsafe(`insert into archetipo.checkout_owner (checkout) values ($1) on conflict do nothing`, root);
    console.log(`Empty owned database claimed for ${root} (${id.version.split(',')[0]})`);
  } finally { await p.$disconnect(); }
}

function verifyInstall() {
  const nm = path.join(root, 'node_modules');
  if (!fs.existsSync(nm)) fail('node_modules is missing');
  const real = fs.realpathSync(nm);
  if (real !== nm) fail(`node_modules resolves outside this checkout: ${real}`);
  const locked = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8')).packages;
  let count = 0;
  for (const [loc, pkg] of Object.entries(locked)) {
    if (!loc || !pkg.version || pkg.link) continue;
    const manifest = path.join(root, loc, 'package.json');
    if (!fs.existsSync(manifest)) { if (pkg.optional) continue; fail(`Locked dependency missing: ${loc}`); }
    const v = JSON.parse(fs.readFileSync(manifest, 'utf8')).version;
    if (v !== pkg.version) fail(`Installed ${loc}@${v} differs from lockfile ${pkg.version}`);
    count++;
  }
  if (!fs.existsSync(path.join(nm, '.prisma', 'client', 'index.js'))) fail('Generated Prisma client is missing');
  return count;
}

function installStamp() {
  const h = crypto.createHash('sha256');
  h.update(fs.readFileSync(path.join(root, 'package-lock.json')));
  h.update(`${process.version}|${process.platform}|${process.arch}`);
  return h.digest('hex');
}

async function install() {
  const env = projectEnv();
  const stampFile = path.join(root, 'node_modules', '.archetipo-install.sha256');
  const stamp = installStamp();
  const current = fs.existsSync(stampFile) ? fs.readFileSync(stampFile, 'utf8') : '';
  if (current !== stamp) {
    // Locked install; lifecycle scripts run explicitly below so the root postinstall
    // (prisma db push) can never write before the target is verified.
    run(['npm', 'ci', '--ignore-scripts', '--no-audit', '--no-fund'], env);
    const locked = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8')).packages;
    const scripted = Object.entries(locked)
      .filter(([loc, p]) => loc && p.hasInstallScript && fs.existsSync(path.join(root, loc, 'package.json')))
      .map(([loc]) => loc.replace(/^.*node_modules\//, ''));
    console.log(`Running dependency install scripts: ${scripted.join(', ')}`);
    if (scripted.length) run(['npm', 'rebuild', '--foreground-scripts', ...scripted], env);
    fs.writeFileSync(stampFile, stamp);
  } else {
    console.log('Locked dependencies already installed for this lockfile and runtime');
  }
  run([process.execPath, bin('prisma/build/index.js'), 'generate'], env);
  console.log(`Verified ${verifyInstall()} installed packages against package-lock.json`);
}

async function schema() {
  const env = projectEnv();
  await verifyTarget(env, { claim: false });
  // No --accept-data-loss: a destructive schema change fails instead of dropping data.
  run([process.execPath, bin('prisma/build/index.js'), 'db', 'push', '--skip-generate'], env);
  const bcrypt = require(bin('bcryptjs'));
  const p = prismaClient(env);
  try {
    // Conservative synthetic fixtures: created when missing, never reset or overwritten.
    await p.user.upsert({ where: { email: FIXTURE_EMAIL }, update: {}, create: { id: FIXTURE_ID, email: FIXTURE_EMAIL, name: 'Fixture ambiente', role: 'Explorer' } });
    const demo = await p.user.findUnique({ where: { email: DEMO_EMAIL } });
    if (!demo) {
      await p.user.create({ data: { email: DEMO_EMAIL, name: 'Ranger Demo', role: 'Ranger', emailVerified: new Date(), password: await bcrypt.hash(DEMO_PASSWORD, 12) } });
      console.log(`Created synthetic demo login ${DEMO_EMAIL}`);
    }
    console.log(`Users in owned database: ${await p.user.count()} (existing rows preserved)`);
  } finally { await p.$disconnect(); }
}

async function ready() {
  const env = projectEnv();
  verifyInstall();
  await verifyTarget(env, { claim: false });
  const { Prisma } = require(bin('@prisma/client'));
  const p = prismaClient(env);
  try {
    for (const m of Prisma.dmmf.datamodel.models) await p[m.name[0].toLowerCase() + m.name.slice(1)].findFirst();
    const row = await p.user.findUnique({ where: { email: FIXTURE_EMAIL } });
    if (!row || row.id !== FIXTURE_ID) fail('Persistent environment fixture is missing');
    console.log('Generated client, schema compatibility for every model and persistent fixture verified');
  } finally { await p.$disconnect(); }
}

function runParallel(tasks, env) {
  return Promise.all(tasks.map(({ name, argv }) => new Promise(resolve => {
    const started = Date.now();
    const child = spawn(argv[0], argv.slice(1), { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { out += d; });
    child.on('error', err => { out += String(err); });
    child.on('close', code => resolve({ name, code, out, seconds: ((Date.now() - started) / 1000).toFixed(1) }));
  })));
}

async function quality() {
  const env = { ...projectEnv(), NODE_ENV: 'test' };
  const results = await runParallel([
    { name: 'lint', argv: [process.execPath, bin('eslint/bin/eslint.js'), 'src/'] },
    // Application type-checking is performed by the `build` check (next build); no duplicate tsc here.
    { name: 'tests', argv: [process.execPath, bin('jest/bin/jest.js'), '--ci', '--watchAll=false', `--cacheDirectory=${path.join(stateDir, 'jest-cache')}`] },
  ], env);
  for (const r of results) {
    console.log(`\n===== ${r.name}: ${r.code === 0 ? 'PASSED' : `FAILED (exit ${r.code})`} in ${r.seconds}s =====`);
    console.log(r.out.trimEnd());
  }
  console.log('\n===== summary =====');
  for (const r of results) console.log(`${r.name}: ${r.code === 0 ? 'passed' : 'FAILED'} (${r.seconds}s)`);
  if (results.some(r => r.code !== 0)) process.exitCode = 1;
}

async function build() {
  const env = { ...projectEnv(), NODE_ENV: 'production' };
  run([process.execPath, bin('next/dist/bin/next'), 'build'], env);
}

async function persistence() {
  const env = projectEnv();
  await verifyTarget(env, { claim: false });
  const stamp = new Date().toISOString();
  const writer = prismaClient(env);
  try {
    // Real Prisma persistence path against the owned database; touches only its own synthetic row.
    await writer.user.upsert({ where: { email: PERSISTENCE_EMAIL }, update: { bio: `persistence check ${stamp}` }, create: { email: PERSISTENCE_EMAIL, name: 'Persistence check', role: 'Explorer', bio: `persistence check ${stamp}` } });
  } finally { await writer.$disconnect(); }
  const reader = prismaClient(env);
  try {
    const row = await reader.user.findUnique({ where: { email: PERSISTENCE_EMAIL } });
    if (row?.bio !== `persistence check ${stamp}`) fail('Written row was not read back from a new connection');
    const fixture = await reader.user.findUnique({ where: { email: FIXTURE_EMAIL } });
    if (fixture?.id !== FIXTURE_ID) fail('Environment fixture missing: data was not preserved');
    const demo = await reader.user.findUnique({ where: { email: DEMO_EMAIL } });
    if (!demo) fail('Demo login missing: data was not preserved');
    console.log(`Persistence verified on owned database; fixtures preserved (${await reader.user.count()} users)`);
  } finally { await reader.$disconnect(); }
}

function preview(port) {
  if (!/^\d+$/.test(port || '')) fail('Missing preview port');
  const child = spawn(process.execPath, [bin('next/dist/bin/next'), 'dev', '--hostname', '127.0.0.1', '--port', port], { cwd: root, env: { ...projectEnv(port), NODE_ENV: 'development' }, stdio: 'inherit' });
  for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => child.kill(sig));
  child.on('exit', (code, signal) => { process.exitCode = code ?? (signal ? 1 : 0); });
}

const ops = { install, schema, ready, quality, build, persistence, target: () => verifyTarget(projectEnv(), { claim: true }) };
const action = process.argv[2];
if (action === 'preview') {
  try { preview(process.argv[3]); } catch (e) { console.error(e.message); process.exitCode = 1; }
} else if (ops[action]) {
  Promise.resolve().then(() => ops[action]()).catch(e => { console.error(e.message); process.exitCode = 1; });
} else {
  console.error(`Unknown operation: ${action}`);
  process.exitCode = 2;
}
