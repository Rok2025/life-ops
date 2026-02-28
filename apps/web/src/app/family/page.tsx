'use client';

import { Users } from 'lucide-react';

export default function FamilyPage() {
    return (
        <div className="space-y-section">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Users size={20} className="text-accent" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-text-primary">家庭</h1>
                    <p className="text-text-secondary">家庭生活管理</p>
                </div>
            </div>

            <div className="p-card-lg rounded-xl border border-border bg-bg-secondary/50 text-center">
                <p className="text-text-tertiary text-base">🚧 功能开发中...</p>
                <p className="text-text-tertiary text-sm mt-2">即将支持：家庭日程、又又成长记录</p>
            </div>
        </div>
    );
}
