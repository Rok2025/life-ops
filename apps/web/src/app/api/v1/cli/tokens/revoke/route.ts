import { authenticateCliRequest, revokeCliToken } from '@/features/cli-api/server';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
    try {
        const token = await authenticateCliRequest(request);
        await revokeCliToken(token.user_id, token.id);
        return new Response(null, { status: 204 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'unauthorized';
        return Response.json({ error: message }, { status: message === 'unauthorized' ? 401 : 403 });
    }
}
