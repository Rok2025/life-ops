'use server';

import { requireUser } from '@/lib/auth/server';
import { approveCliDeviceAuthorization, revokeCliToken } from './server';

export async function approveCliDeviceAction(userCode: string): Promise<{ deviceName: string; scopes: string[] }> {
    const user = await requireUser();
    return approveCliDeviceAuthorization(user.id, userCode);
}

export async function revokeCliDeviceAction(tokenId: string): Promise<void> {
    const user = await requireUser();
    await revokeCliToken(user.id, tokenId);
}
