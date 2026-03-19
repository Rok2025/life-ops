import http from 'node:http';
import { loadHarnessEnv } from './config/load-env.mjs';
import {
  getBearerToken,
  readJsonBody,
  sendJson,
  sendMethodNotAllowed,
  sendNotFound,
} from './lib/http.mjs';
import { runAgent } from './runtime/run-agent.mjs';
import { listSessionRuns, recordRun } from './runtime/store/file-store.mjs';
import { listTools } from './runtime/tools/registry.mjs';

const config = loadHarnessEnv();

function matchRunRoute(pathname) {
  const match = pathname.match(/^\/sessions\/([^/]+)\/runs$/);
  if (!match) return null;

  return {
    sessionId: decodeURIComponent(match[1]),
  };
}

async function handleRequest(request, response) {
  const requestUrl = new URL(request.url ?? '/', 'http://localhost');
  const { pathname } = requestUrl;

  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    });
    response.end();
    return;
  }

  if (pathname === '/health') {
    if (request.method !== 'GET') return sendMethodNotAllowed(response, request.method);
    return sendJson(response, 200, {
      ok: true,
      service: '@life-ops/harness-api',
      timestamp: new Date().toISOString(),
    });
  }

  if (pathname === '/tools') {
    if (request.method !== 'GET') return sendMethodNotAllowed(response, request.method);
    return sendJson(response, 200, {
      tools: listTools(),
    });
  }

  const runRoute = matchRunRoute(pathname);
  if (runRoute) {
    if (request.method === 'GET') {
      const requestedLimit = Number(requestUrl.searchParams.get('limit') ?? 20);
      const limit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? requestedLimit : 20;
      const history = await listSessionRuns({
        config,
        sessionId: runRoute.sessionId,
        limit,
      });

      return sendJson(response, 200, {
        session: history.session,
        runs: history.runs,
        limit,
      });
    }

    if (request.method !== 'POST') return sendMethodNotAllowed(response, request.method);

    try {
      const body = await readJsonBody(request);
      const authToken = getBearerToken(request);
      const runRequest = {
        message: typeof body.message === 'string' ? body.message : '',
        toolName: typeof body.toolName === 'string' ? body.toolName : null,
        input: body.input && typeof body.input === 'object' ? body.input : {},
      };

      const result = await runAgent({
        sessionId: runRoute.sessionId,
        message: runRequest.message,
        toolName: runRequest.toolName,
        input: runRequest.input,
        authToken,
        config,
      });

      try {
        await recordRun({
          config,
          sessionId: runRoute.sessionId,
          request: runRequest,
          result,
        });
      } catch (error) {
        result.persistence = {
          status: 'failed',
          errorMessage:
            error instanceof Error ? error.message : 'Failed to persist harness run history.',
        };
      }

      return sendJson(response, result.status === 'failed' ? 500 : 200, result);
    } catch (error) {
      return sendJson(response, 400, {
        error: error instanceof Error ? error.message : 'Invalid request body',
      });
    }
  }

  return sendNotFound(response, pathname);
}

const server = http.createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : 'Unhandled server error',
    });
  });
});

server.listen(config.port, config.host, () => {
  console.log(
    `[harness-api] listening on http://${config.host}:${config.port} (timezone=${config.defaultTimezone})`
  );
});
