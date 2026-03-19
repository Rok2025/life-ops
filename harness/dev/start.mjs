import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const services = [
  {
    name: 'api',
    entry: path.resolve(rootDir, '../api/src/server.mjs'),
  },
  {
    name: 'ui',
    entry: path.resolve(rootDir, '../ui/server.mjs'),
  },
];

const children = [];
let shuttingDown = false;

function pipeOutput(child, name, target) {
  let buffer = '';

  child.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      target.write(`[harness-dev:${name}] ${line}\n`);
    }
  });

  child.on('end', () => {
    if (buffer) {
      target.write(`[harness-dev:${name}] ${buffer}\n`);
      buffer = '';
    }
  });
}

function shutdown(signal = 'SIGTERM') {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }

  setTimeout(() => {
    for (const child of children) {
      if (!child.killed) {
        child.kill('SIGKILL');
      }
    }
  }, 2_000).unref();
}

function startService(service) {
  const child = spawn(process.execPath, [service.entry], {
    cwd: path.resolve(rootDir, '..'),
    env: process.env,
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  pipeOutput(child.stdout, service.name, process.stdout);
  pipeOutput(child.stderr, service.name, process.stderr);

  child.on('exit', (code, signal) => {
    if (shuttingDown) return;

    const reason = signal ? `signal ${signal}` : `code ${code ?? 0}`;
    process.stderr.write(`[harness-dev] ${service.name} exited with ${reason}\n`);
    process.exitCode = code ?? 1;
    shutdown();
  });

  children.push(child);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.stdout.write('[harness-dev] starting api + ui\n');

for (const service of services) {
  startService(service);
}
