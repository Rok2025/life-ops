'use client';

import { Wallet } from 'lucide-react';
import { Card, PageHero } from '@/components/ui';

export default function FinancePage() {
    return (
        <div className="space-y-4 xl:space-y-5">
            <PageHero
                eyebrow="生活 / 财务"
                icon={<Wallet size={18} className="text-accent" />}
                title="财务"
                description="后续会把收支、预算和资产变化收在同一处，让财务视图和其他领域保持一致。"
                stats={[
                    { label: '模块状态', value: '筹备中', meta: '等待接入', tone: 'accent' },
                    { label: '首批能力', value: '3 项', meta: '收支 / 预算 / 资产', tone: 'warning' },
                ]}
            />

            <div className="grid gap-4 lg:grid-cols-3">
                <Card className="p-card">
                    <p className="text-body-sm font-medium text-text-primary">收支记录</p>
                    <p className="mt-2 text-body-sm text-text-secondary">记录日常现金流，形成月度收支视图。</p>
                </Card>
                <Card className="p-card">
                    <p className="text-body-sm font-medium text-text-primary">预算管理</p>
                    <p className="mt-2 text-body-sm text-text-secondary">为重点类别设预算上限，提前看到偏离趋势。</p>
                </Card>
                <Card className="p-card">
                    <p className="text-body-sm font-medium text-text-primary">资产统计</p>
                    <p className="mt-2 text-body-sm text-text-secondary">统一查看账户、现金和长期资产的变化。</p>
                </Card>
            </div>
        </div>
    );
}
