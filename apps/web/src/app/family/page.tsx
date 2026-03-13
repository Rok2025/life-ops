'use client';

import { Users } from 'lucide-react';
import { Card, PageHero } from '@/components/ui';

export default function FamilyPage() {
    return (
        <div className="space-y-4 xl:space-y-5">
            <PageHero
                eyebrow="生活 / 家庭"
                icon={<Users size={18} className="text-accent" />}
                title="家庭"
                description="把家庭日程、成长记录和共享事务放进同一块面板，保持生活安排更有序。"
                stats={[
                    { label: '模块状态', value: '筹备中', meta: '等待接入', tone: 'accent' },
                    { label: '首批能力', value: '2 项', meta: '日程 / 成长', tone: 'success' },
                ]}
            />

            <div className="grid gap-4 lg:grid-cols-2">
                <Card className="p-card">
                    <p className="text-body-sm font-medium text-text-primary">家庭日程</p>
                    <p className="mt-2 text-body-sm text-text-secondary">
                        日常安排、重要提醒和家庭节奏会在这里集中展示。
                    </p>
                </Card>
                <Card className="p-card">
                    <p className="text-body-sm font-medium text-text-primary">成长记录</p>
                    <p className="mt-2 text-body-sm text-text-secondary">
                        又又的成长节点、照片与备忘会以时间线方式沉淀。
                    </p>
                </Card>
            </div>
        </div>
    );
}
