import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = fileURLToPath(new URL('../out/', import.meta.url));
const marker = 'id="chunk-load-recovery-inline"';
const recoveryScript = String.raw`
(() => {
  const reloadKey = 'life-ops:chunk-reload-attempted';
  const isChunkLoadError = (value) => {
    const message = String(value?.message || value || '');
    return message.includes('ChunkLoadError') || message.includes('Loading chunk') || message.includes('Failed to load chunk');
  };
  const reloadOnce = () => {
    try {
      if (sessionStorage.getItem(reloadKey) === '1') return;
      sessionStorage.setItem(reloadKey, '1');
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set('__reload', Date.now().toString(36));
      window.location.replace(nextUrl.toString());
    } catch {
      window.location.reload();
    }
  };

  window.addEventListener('error', (event) => {
    const target = event.target;
    if (target?.tagName === 'SCRIPT' && target.src?.includes('/_next/static/')) {
      reloadOnce();
      return;
    }
    if (isChunkLoadError(event.error || event.message)) reloadOnce();
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    if (isChunkLoadError(event.reason)) reloadOnce();
  });

  window.addEventListener('load', () => {
    try {
      sessionStorage.removeItem(reloadKey);
    } catch {}
  });
})();
`.trim();
const tag = `<script ${marker}>${recoveryScript}</script>`;

async function listHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listHtmlFiles(entryPath));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(entryPath);
    }
  }

  return files;
}

const htmlFiles = await listHtmlFiles(outDir);
let injectedCount = 0;

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  if (html.includes(marker)) continue;

  const nextHtml = html.replace('<head>', `<head>${tag}`);
  if (nextHtml === html) {
    throw new Error(`Unable to inject chunk recovery script into ${file}`);
  }

  await writeFile(file, nextHtml);
  injectedCount += 1;
}

console.log(`Injected chunk recovery script into ${injectedCount} HTML file(s).`);
