'use client';

import { FormEvent, useState } from 'react';
import { ArrowRight, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { authApi } from '@/features/auth';
import { Button, Card, Input } from '@/components/ui';
import FinanceOverview from './FinanceOverview';
import { verifyFinanceAccessPassword } from '../lib/financeAccess';

type FinanceAccessGateProps = {
    userEmail: string | null | undefined;
    userId: string;
};

export default function FinanceAccessGate({ userEmail, userId }: FinanceAccessGateProps) {
    const [password, setPassword] = useState('');
    const [unlocked, setUnlocked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (loading) return;

        setLoading(true);
        setError(null);

        try {
            await verifyFinanceAccessPassword({
                email: userEmail,
                password,
                signInWithPassword: authApi.signInWithPassword,
            });
            setPassword('');
            setUnlocked(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : '密码验证失败，请重试。');
        } finally {
            setLoading(false);
        }
    };

    if (unlocked) {
        return <FinanceOverview initialUserId={userId} />;
    }

    return (
        <div className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-md items-center">
            <Card className="w-full p-card">
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-accent">
                        <ShieldCheck size={22} />
                    </div>
                    <div>
                        <h1 className="text-h2 text-text-primary">财务访问验证</h1>
                        <p className="mt-1 text-body-sm text-text-secondary">请输入登录密码后继续。</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="ml-1 text-caption font-medium uppercase text-text-tertiary">
                            访问密码
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                            <Input
                                type="password"
                                required
                                autoFocus
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                className="bg-bg-tertiary/50 pl-10 pr-4 py-2.5"
                                placeholder="请输入登录密码"
                                error={!!error}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-card border border-danger/20 bg-danger/10 p-3 text-caption text-danger">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 font-semibold"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                进入财务
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                </form>
            </Card>
        </div>
    );
}
