import Sidebar from '@/components/layout/Sidebar';
import SummaryPanel from '@/components/layout/SummaryPanel';
import { AuthProvider } from '@/contexts/AuthContext';
import { requireUser } from '@/lib/auth/server';
import QueryProvider from '@/providers/QueryProvider';

export default async function AppLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const user = await requireUser();

    return (
        <QueryProvider>
            <AuthProvider initialUser={user}>
                <div className="flex min-h-screen">
                    <Sidebar />
                    <main className="flex-1 ml-(--sidebar-width) mr-(--summary-width)">
                        <div className="max-w-6xl mx-auto py-page-y px-page-x">
                            {children}
                        </div>
                    </main>
                    <SummaryPanel />
                </div>
            </AuthProvider>
        </QueryProvider>
    );
}
