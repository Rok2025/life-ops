import AppShell from '@/components/layout/AppShell';
import { requireUser } from '@/lib/auth/server';

export default async function AppLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const user = await requireUser();

    return (
        <AppShell initialUser={user}>
            {children}
        </AppShell>
    );
}
