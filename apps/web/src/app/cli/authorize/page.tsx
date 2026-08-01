import { redirect } from 'next/navigation';
import { CliAuthorizationClient } from '@/features/cli-api/components/CliAuthorizationClient';
import { getCurrentUser } from '@/lib/auth/server';

interface CliAuthorizePageProps {
    searchParams: Promise<{ code?: string }>;
}

export default async function CliAuthorizePage({ searchParams }: CliAuthorizePageProps) {
    const { code } = await searchParams;
    const userCode = code?.trim().toUpperCase();
    if (!userCode || !/^[A-Z0-9_-]{6,16}$/.test(userCode)) redirect('/');

    const user = await getCurrentUser();
    if (!user) redirect(`/login?next=${encodeURIComponent(`/cli/authorize?code=${userCode}`)}`);
    return <CliAuthorizationClient userCode={userCode} />;
}
