import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../'
);

function parseEnvFile(content) {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .reduce((acc, line) => {
      const separatorIndex = line.indexOf('=');
      if (separatorIndex === -1) return acc;

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      if (!key) return acc;

      acc[key] = value;
      return acc;
    }, {});
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return parseEnvFile(fs.readFileSync(filePath, 'utf8'));
}

export function loadHarnessEnv() {
  const layeredEnv = [
    path.join(repoRoot, 'apps/web/.env.local'),
    path.join(repoRoot, 'harness/.env.local'),
    path.join(repoRoot, 'harness/api/.env.local'),
  ].reduce((acc, filePath) => ({ ...acc, ...readEnvFile(filePath) }), {});

  const merged = {
    ...layeredEnv,
    ...process.env,
  };

  return {
    host: merged.HARNESS_API_HOST ?? '127.0.0.1',
    port: Number(merged.HARNESS_API_PORT ?? 4318),
    defaultTimezone: merged.HARNESS_DEFAULT_TIMEZONE ?? 'Asia/Shanghai',
    runtimeDir:
      merged.HARNESS_RUNTIME_DIR ?? path.join(repoRoot, 'harness/.runtime'),
    supabaseUrl: merged.SUPABASE_URL ?? merged.NEXT_PUBLIC_SUPABASE_URL ?? '',
    supabaseAnonKey:
      merged.SUPABASE_ANON_KEY ?? merged.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  };
}
