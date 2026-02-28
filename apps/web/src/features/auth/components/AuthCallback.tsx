'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/features/auth';

export default function AuthCallback() {
    const router = useRouter();
    const [message, setMessage] = useState('正在完成登录...');

    useEffect(() => {
        async function handleCallback() {
            const searchParams = new URLSearchParams(window.location.search);
            const code = searchParams.get('code');

            if (!code) {
                setMessage('登录回调参数缺失，正在返回登录页...');
                router.replace('/login');
                return;
            }

            try {
                await authApi.exchangeCodeForSession(code);
                router.replace('/');
            } catch {
                setMessage('登录确认失败，正在返回登录页...');
                router.replace('/login');
            }
        }

        handleCallback();
    }, [router]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center text-text-secondary">
            {message}
        </div>
    );
}
