'use client';

import { PenLine } from 'lucide-react';

export default function OutputPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
                    <PenLine size={24} className="text-accent" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">输出</h1>
                    <p className="text-text-secondary">创作与分享</p>
                </div>
            </div>

            <div className="p-8 rounded-2xl border border-border bg-bg-secondary/50 text-center">
                <p className="text-text-tertiary text-lg">🚧 功能开发中...</p>
                <p className="text-text-tertiary text-sm mt-2">即将支持：博客文章、技术笔记、创作记录</p>
            </div>
        </div>
    );
}
