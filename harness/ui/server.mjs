import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(rootDir, 'public');
const host = process.env.HARNESS_UI_HOST ?? '127.0.0.1';
const port = Number(process.env.HARNESS_UI_PORT ?? 4319);
const defaultApiBase =
  process.env.HARNESS_UI_API_BASE ?? 'http://127.0.0.1:4318';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

function send(response, statusCode, contentType, content) {
  response.writeHead(statusCode, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
  });
  response.end(content);
}

function resolveFilePath(pathname) {
  const normalizedPath = pathname === '/' ? '/index.html' : pathname;
  const unsafePath = path.normalize(normalizedPath).replace(/^(\.\.[/\\])+/, '');
  return path.join(publicDir, unsafePath);
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url ?? '/', 'http://localhost');

  if (requestUrl.pathname === '/config.json') {
    return send(
      response,
      200,
      mimeTypes['.json'],
      JSON.stringify({ apiBase: defaultApiBase }, null, 2)
    );
  }

  const filePath = resolveFilePath(requestUrl.pathname);

  if (!filePath.startsWith(publicDir)) {
    return send(response, 403, 'text/plain; charset=utf-8', 'Forbidden');
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    return send(response, 404, 'text/plain; charset=utf-8', 'Not Found');
  }

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] ?? 'application/octet-stream';
  return send(response, 200, contentType, fs.readFileSync(filePath));
});

server.listen(port, host, () => {
  console.log(`[harness-ui] listening on http://${host}:${port}`);
});
