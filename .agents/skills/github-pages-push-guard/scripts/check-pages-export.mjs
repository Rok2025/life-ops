#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REQUIRED_ROUTES = ['/', '/timeline/'];
const BASE_PATH = '/life-ops';
const CHUNK_RECOVERY_MARKER = 'id="chunk-load-recovery-inline"';

function findRepoRoot(startDir) {
  let current = resolve(startDir);

  while (current !== dirname(current)) {
    if (existsSync(join(current, 'apps/web/package.json'))) {
      return current;
    }
    current = dirname(current);
  }

  throw new Error('Unable to find repository root containing apps/web/package.json');
}

function run(command, args, cwd) {
  console.log(`\n$ ${[command, ...args].join(' ')}`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`Command failed with exit code ${result.status}: ${command} ${args.join(' ')}`);
  }
}

function listFiles(dir, predicate) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath, predicate));
    } else if (entry.isFile() && predicate(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

function routeToHtml(outDir, route) {
  if (route === '/') return join(outDir, 'index.html');
  const normalized = route.replace(/^\/+/, '').replace(/\/+$/, '');
  return join(outDir, normalized, 'index.html');
}

function normalizeNextAssetRef(value) {
  return value
    .replace(/\\+$/g, '')
    .replace(/[?#].*$/g, '');
}

function checkHtmlAssets(outDir, htmlFiles) {
  const missingAssets = new Set();
  const rootNextAttributes = new Set();
  let checkedAssets = 0;

  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');

    const assetRefs = [...html.matchAll(/\/life-ops\/_next\/[^"'<> ]+/g)]
      .map((match) => normalizeNextAssetRef(match[0]));

    for (const ref of new Set(assetRefs)) {
      checkedAssets += 1;
      const assetPath = join(outDir, ref.replace(`${BASE_PATH}/`, ''));
      if (!existsSync(assetPath)) {
        missingAssets.add(ref);
      }
    }

    const directRootRefs = [...html.matchAll(/\b(?:src|href)=["'](\/_next\/[^"']+)["']/g)]
      .map((match) => match[1]);

    for (const ref of directRootRefs) {
      rootNextAttributes.add(ref);
    }
  }

  return {
    checkedAssets,
    missingAssets: [...missingAssets],
    rootNextAttributes: [...rootNextAttributes],
  };
}

function checkNextConfig(repoRoot) {
  const configPath = join(repoRoot, 'apps/web/next.config.ts');
  const config = readFileSync(configPath, 'utf8');
  const requiredBasePath = `basePath: isProd ? '${BASE_PATH}' : ''`;
  const requiredAssetPrefix = `assetPrefix: isProd ? '${BASE_PATH}/' : ''`;

  if (!config.includes(requiredBasePath)) {
    throw new Error(`next.config.ts must keep the production basePath at ${BASE_PATH}. Expected: ${requiredBasePath}`);
  }

  if (!config.includes(requiredAssetPrefix)) {
    throw new Error(`next.config.ts must keep the production assetPrefix at ${BASE_PATH}/. Expected: ${requiredAssetPrefix}`);
  }
}

function main() {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const repoRoot = findRepoRoot(process.cwd() || scriptDir);
  const outDir = join(repoRoot, 'apps/web/out');

  checkNextConfig(repoRoot);
  run('pnpm', ['--filter', 'web', 'build'], repoRoot);

  if (!existsSync(outDir) || !statSync(outDir).isDirectory()) {
    throw new Error(`Static export directory is missing: ${outDir}`);
  }

  const missingRoutes = REQUIRED_ROUTES.filter((route) => !existsSync(routeToHtml(outDir, route)));
  if (missingRoutes.length > 0) {
    throw new Error(`Missing required exported route(s): ${missingRoutes.join(', ')}`);
  }

  const htmlFiles = listFiles(outDir, (file) => file.endsWith('.html'));
  if (htmlFiles.length === 0) {
    throw new Error(`No HTML files found in static export: ${outDir}`);
  }

  const htmlWithoutRecovery = htmlFiles.filter((file) => !readFileSync(file, 'utf8').includes(CHUNK_RECOVERY_MARKER));
  if (htmlWithoutRecovery.length > 0) {
    throw new Error(`Chunk recovery script was not injected into ${htmlWithoutRecovery.length} HTML file(s).`);
  }

  const assetCheck = checkHtmlAssets(outDir, htmlFiles);
  if (assetCheck.missingAssets.length > 0) {
    throw new Error(`Missing exported asset(s):\n${assetCheck.missingAssets.join('\n')}`);
  }

  if (assetCheck.rootNextAttributes.length > 0) {
    throw new Error(`Found root-level _next asset attribute(s) that can break GitHub Pages:\n${assetCheck.rootNextAttributes.join('\n')}`);
  }

  console.log('\nGitHub Pages guard passed.');
  console.log(JSON.stringify({
    outDir,
    htmlFiles: htmlFiles.length,
    checkedAssets: assetCheck.checkedAssets,
    requiredRoutes: REQUIRED_ROUTES,
    basePath: BASE_PATH,
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.error('\nGitHub Pages guard failed.');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
