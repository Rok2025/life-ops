import LoginForm from '@/features/auth/components/LoginForm';
import { getCurrentUser } from '@/lib/auth/server';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
    const user = await getCurrentUser();

    if (user) {
        redirect('/');
    }

    return <LoginForm />;
}
