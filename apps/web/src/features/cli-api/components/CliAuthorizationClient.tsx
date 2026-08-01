'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2, Laptop, ShieldCheck } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { approveCliDeviceAction } from '../actions';

interface CliAuthorizationClientProps {
    userCode: string;
}

export function CliAuthorizationClient({ userCode }: CliAuthorizationClientProps) {
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<{ deviceName: string; scopes: string[] } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const approve = (): void => {
        setError(null);
        startTransition(async () => {
            try {
                setResult(await approveCliDeviceAction(userCode));
            } catch (caught) {
                setError(caught instanceof Error ? caught.message : '授权失败，请返回 CLI 重新开始。');
            }
        });
    };

    return (
        <main className="min-h-screen bg-bg-primary px-4 py-12">
            <Card className="mx-auto max-w-lg p-6 sm:p-8">
                {result ? (
                    <div className="space-y-5 text-center">
                        <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
                        <div>
                            <h1 className="text-h2 text-text-primary">设备已授权</h1>
                            <p className="mt-2 text-body-sm text-text-secondary">{result.deviceName} 现在可以使用：{result.scopes.join('、')}</p>
                        </div>
                        <p className="rounded-control bg-success/10 px-4 py-3 text-body-sm text-success">可以回到终端继续完成登录。</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-start gap-3">
                            <div className="rounded-control bg-accent/10 p-2 text-accent"><Laptop size={20} /></div>
                            <div>
                                <p className="text-caption font-medium uppercase tracking-wide text-accent">Life OPS CLI</p>
                                <h1 className="mt-1 text-h2 text-text-primary">授权这台设备</h1>
                                <p className="mt-2 text-body-sm text-text-secondary">确认后，CLI 将获得一个可撤销、90 天有效的设备 Token。</p>
                            </div>
                        </div>
                        <div className="rounded-card border border-glass-border bg-panel-bg p-4">
                            <p className="text-caption text-text-tertiary">一次性授权码</p>
                            <p className="mt-1 font-mono text-h2 tracking-[0.16em] text-text-primary">{userCode}</p>
                        </div>
                        <div className="flex gap-3 rounded-card bg-selection-bg p-4 text-body-sm text-text-secondary">
                            <ShieldCheck className="mt-0.5 shrink-0 text-accent" size={18} />
                            <p>仅授权本次 CLI 登录请求。之后可在“开发者访问”页面随时撤销。</p>
                        </div>
                        {error ? <p className="rounded-control bg-danger/10 p-3 text-body-sm text-danger">{error}</p> : null}
                        <Button type="button" className="w-full" disabled={isPending} onClick={approve}>
                            {isPending ? '授权中…' : '确认授权此设备'}
                        </Button>
                    </div>
                )}
            </Card>
        </main>
    );
}
