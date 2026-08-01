import { authenticateCliRequest, logFinanceTransaction } from '@/features/cli-api/server';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ toolName: string }> };

export async function POST(request: Request, context: RouteContext): Promise<Response> {
    const { toolName } = await context.params;
    if (toolName !== 'log_finance_transaction') {
        return Response.json({ error: 'tool_not_found' }, { status: 404 });
    }

    try {
        const token = await authenticateCliRequest(request, 'finance:write');
        const idempotencyKey = request.headers.get('idempotency-key') ?? '';
        const body: unknown = await request.json();
        const { result, replayed } = await logFinanceTransaction(token, body, idempotencyKey);
        return Response.json({ ...result, replayed });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to run tool.';
        const status = message === 'unauthorized' ? 401 : message === 'forbidden' ? 403 : 400;
        return Response.json({ error: message }, { status });
    }
}
