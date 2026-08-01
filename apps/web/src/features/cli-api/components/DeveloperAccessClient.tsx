'use client';

import { useState, useTransition } from 'react';
import { KeyRound, Laptop, ShieldOff, TerminalSquare } from 'lucide-react';
import { Button, Card, PageHero } from '@/components/ui';
import { revokeCliDeviceAction } from '../actions';
import type { CliScope } from '../types';

type CliDevice = {
    id: string;
    device_name: string;
    scopes: CliScope[];
    expires_at: string;
    revoked_at: string | null;
    last_used_at: string | null;
};

function formatDate(value: string | null): string {
    if (!value) return '尚未使用';
    return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function DeveloperAccessClient({ initialDevices }: { initialDevices: CliDevice[] }) {
    const [devices, setDevices] = useState(initialDevices);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const revoke = (tokenId: string): void => {
        setError(null);
        startTransition(async () => {
            try {
                await revokeCliDeviceAction(tokenId);
                setDevices((current) => current.map((device) => device.id === tokenId ? { ...device, revoked_at: new Date().toISOString() } : device));
            } catch (caught) {
                setError(caught instanceof Error ? caught.message : '撤销失败，请重试。');
            }
        });
    };

    return (
        <div className="mx-auto max-w-5xl space-y-5">
            <PageHero
                eyebrow="系统 / 开发者访问"
                icon={<TerminalSquare size={18} className="text-accent" />}
                title="CLI 与设备授权"
                description="管理能够通过 Life OPS CLI 调用系统能力的设备。设备 Token 可随时撤销。"
                stats={[
                    { label: '已授权设备', value: devices.filter((device) => !device.revoked_at).length, meta: '可调用 API', tone: 'accent' },
                    { label: '可用 Tool', value: 1, meta: '财务记录', tone: 'success' },
                    { label: 'Token 有效期', value: '90 天', meta: '需重新授权', tone: 'warning' },
                ]}
            />
            <Card className="p-5">
                <div className="flex items-start gap-3">
                    <KeyRound size={20} className="mt-0.5 text-accent" />
                    <div className="space-y-1">
                        <h2 className="text-body font-semibold text-text-primary">在新设备安装 CLI</h2>
                        <code className="block rounded-control bg-panel-bg px-3 py-2 text-body-sm text-text-secondary">pnpm --dir packages/cli link --global && lifeops login</code>
                    </div>
                </div>
            </Card>
            {error ? <p className="rounded-control bg-danger/10 p-3 text-body-sm text-danger">{error}</p> : null}
            <section className="space-y-3">
                <div className="flex items-center gap-2"><Laptop size={18} className="text-text-secondary" /><h2 className="text-h3 text-text-primary">设备列表</h2></div>
                {devices.length === 0 ? (
                    <Card variant="subtle" className="p-5 text-body-sm text-text-secondary">还没有设备授权。首次执行 <code>lifeops login</code> 后会显示在这里。</Card>
                ) : devices.map((device) => (
                    <Card key={device.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2"><h3 className="font-semibold text-text-primary">{device.device_name}</h3>{device.revoked_at ? <span className="text-caption text-danger">已撤销</span> : <span className="text-caption text-success">有效</span>}</div>
                            <p className="text-body-sm text-text-secondary">权限：{device.scopes.join('、')} · 最近使用：{formatDate(device.last_used_at)} · 到期：{formatDate(device.expires_at)}</p>
                        </div>
                        {!device.revoked_at ? <Button variant="danger" size="sm" disabled={isPending} onClick={() => revoke(device.id)}><ShieldOff size={15} />撤销</Button> : null}
                    </Card>
                ))}
            </section>
        </div>
    );
}
