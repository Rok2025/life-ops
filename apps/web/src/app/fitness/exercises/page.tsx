'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** 动作类型管理已迁移至系统配置页面，此页面自动跳转 */
export default function ExercisesPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/settings');
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-text-secondary">正在跳转到系统配置...</div>
        </div>
    );
}
