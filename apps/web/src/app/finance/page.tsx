'use client';

import { Wallet } from 'lucide-react';

export default function FinancePage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
                    <Wallet size={24} className="text-accent" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">财务</h1>
                    <p className="text-text-secondary">财务管理</p>
                </div>
            </div>

            <div className="p-8 rounded-2xl border border-border bg-bg-secondary/50 text-center">
                <p className="text-text-tertiary text-lg">🚧 功能开发中...</p>
                <p className="text-text-tertiary text-sm mt-2">即将支持：收支记录、预算管理、资产统计</p>
            </div>
        </div>
    );
}
