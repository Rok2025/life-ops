import { DeveloperAccessClient } from '@/features/cli-api/components/DeveloperAccessClient';
import { listUserCliTokens } from '@/features/cli-api/server';
import { requireUser } from '@/lib/auth/server';

export default async function DeveloperPage() {
    const user = await requireUser();
    const devices = await listUserCliTokens(user.id);
    return <DeveloperAccessClient initialDevices={devices} />;
}
