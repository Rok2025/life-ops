import { authenticateCliRequest, CLI_TOOLS } from '@/features/cli-api/server';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
    try {
        await authenticateCliRequest(request, 'tools:read');
        return Response.json({ tools: CLI_TOOLS });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'unauthorized';
        return Response.json({ error: message }, { status: message === 'unauthorized' ? 401 : 403 });
    }
}
