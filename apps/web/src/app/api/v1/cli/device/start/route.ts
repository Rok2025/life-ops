import { startCliDeviceAuthorization } from '@/features/cli-api/server';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
    try {
        const body: unknown = await request.json();
        return Response.json(await startCliDeviceAuthorization(body), { status: 201 });
    } catch (error) {
        return Response.json({ error: error instanceof Error ? error.message : 'Could not start device authorization.' }, { status: 400 });
    }
}
