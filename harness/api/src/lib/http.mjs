export async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) return {};

  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

export function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
  response.end(JSON.stringify(payload, null, 2));
}

export function sendNotFound(response, pathname) {
  sendJson(response, 404, {
    error: 'Not Found',
    pathname,
  });
}

export function sendMethodNotAllowed(response, method) {
  sendJson(response, 405, {
    error: 'Method Not Allowed',
    method,
  });
}

export function getBearerToken(request) {
  const raw = request.headers.authorization;
  if (!raw) return null;
  const match = raw.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}
