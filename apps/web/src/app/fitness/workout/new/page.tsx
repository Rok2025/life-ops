'use client';

import { Dumbbell } from 'lucide-react';
import NewWorkoutForm from '@/features/fitness/components/NewWorkoutForm';
import { Card, PageHero } from '@/components/ui';

export default function NewWorkoutPage() {
    return (
        <div className="space-y-4 xl:space-y-5">
            <PageHero
                eyebrow="健身 / 新训练"
                icon={<Dumbbell size={18} className="text-success" />}
                title="记录训练"
                description="把今天的动作、组数和备注完整记下来，让训练历史保持连续。"
            />
            <Card className="p-card">
                <NewWorkoutForm />
            </Card>
        </div>
    );
}
