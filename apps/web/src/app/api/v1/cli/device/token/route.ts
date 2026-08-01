import { exchangeCliDeviceCode } from '@/features/cli-api/server';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
    try {
        const body = await request.json() as { device_code?: unknown };
        if (typeof body.device_code !== 'string' || !body.device_code) {
            return Response.json({ error: 'invalid_request' }, { status: 400 });
        }
        return Response.json(await exchangeCliDeviceCode(body.device_code));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'access_denied';
        const status = message === 'authorization_pending' ? 428 : message === 'expired_token' ? 400 : 403;
        return Response.json({ error: message }, { status });
    }
}
