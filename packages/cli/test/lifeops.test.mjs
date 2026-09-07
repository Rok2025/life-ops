import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { test } from 'node:test';

const run = promisify(execFile);
const cli = fileURLToPath(new URL('../bin/lifeops.mjs', import.meta.url));

async function withApi(handler, check) {
    const requests = [];
    const server = createServer(async (request, response) => {
        let body = '';
        for await (const chunk of request) body += chunk;
        requests.push({ path: request.url, method: request.method, headers: request.headers, body });
        handler(request, response, requests.length);
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address();
    try {
        await check(async (...args) => {
            const { stdout } = await run(process.execPath, [cli, ...args, '--json'], {
                env: { ...process.env, LIFEOPS_API_URL: `http://127.0.0.1:${port}`, LIFEOPS_TOKEN: 'synthetic-cli-token' },
                timeout: 10_000,
            });
            return JSON.parse(stdout);
        }, requests);
    } finally {
        server.closeAllConnections();
        await new Promise((resolve) => server.close(resolve));
    }
}

function json(response, data) {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(data));
}

test('identity and tool discovery use the existing v1 API and bearer token', async () => {
    await withApi((request, response) => json(response, { path: request.url }), async (execute, requests) => {
        assert.deepEqual(await execute('whoami'), { path: '/api/v1/cli/whoami' });
        assert.deepEqual(await execute('tools'), { path: '/api/v1/tools' });
        for (const request of requests) {
            assert.equal(request.method, 'GET');
            assert.equal(request.headers.authorization, 'Bearer synthetic-cli-token');
        }
    });
});

for (const [tool, input, data] of [
    ['log_finance_transaction', { occurred_date: '2026-09-07', amount: 12.5, transaction_type: 'expense', category: 'other' }, { transaction: { id: 'synthetic-transaction' }, accountResolution: 'not_provided' }],
    ['log_fitness_workout', { workout_date: '2026-09-07', exercises: [{ exercise_name: '测试动作', weight: 10, sets: 2, reps: 8 }] }, { workout: { session_id: 'synthetic-session', created_sets: 2 } }],
]) {
    test(`${tool} preserves input, endpoint, receipt and per-invocation idempotency keys`, async () => {
        const receipt = { toolName: tool, confirmation: 'synthetic receipt', data, replayed: false };
        await withApi((_, response) => json(response, receipt), async (execute, requests) => {
            assert.deepEqual(await execute('run', tool, '--input', JSON.stringify(input)), receipt);
            assert.deepEqual(await execute('run', tool, '--input', JSON.stringify(input)), receipt);
            for (const request of requests) {
                assert.equal(request.method, 'POST');
                assert.equal(request.path, `/api/v1/tools/${tool}`);
                assert.deepEqual(JSON.parse(request.body), input);
                assert.match(request.headers['idempotency-key'], /^cli_[A-Za-z0-9_-]+$/);
                assert.equal(request.headers.authorization, 'Bearer synthetic-cli-token');
            }
            assert.notEqual(requests[0].headers['idempotency-key'], requests[1].headers['idempotency-key']);
        });
    });
}

test('a transport retry within one invocation reuses its idempotency key and request body', async () => {
    await withApi((request, response, count) => {
        if (count === 1) request.socket.destroy();
        else json(response, { toolName: 'log_finance_transaction', replayed: true, data: { transaction: { id: 'synthetic-transaction' } } });
    }, async (execute, requests) => {
        const result = await execute('run', 'log_finance_transaction', '--input', '{"amount":12.5}');
        assert.equal(result.replayed, true);
        assert.equal(requests.length, 2);
        assert.equal(requests[0].headers['idempotency-key'], requests[1].headers['idempotency-key']);
        assert.equal(requests[0].body, requests[1].body);
    });
});
