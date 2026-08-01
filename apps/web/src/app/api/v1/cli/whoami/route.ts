import { authenticateCliRequest } from '@/features/cli-api/server';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
    try {
        const token = await authenticateCliRequest(request);
        return Response.json({ userId: token.user_id, deviceName: token.device_name, scopes: token.scopes, expiresAt: token.expires_at });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'unauthorized';
        return Response.json({ error: message }, { status: message === 'unauthorized' ? 401 : 403 });
    }
}
