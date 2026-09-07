'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { KeyRound, Settings } from 'lucide-react';
import { ConfigScopeSection } from './ConfigScopeSection';
import ExerciseManager from './ExerciseManager';
import { configApi } from '../api/configApi';
import { exerciseTypesApi } from '../api/exerciseTypesApi';
import { CONFIG_SCOPES } from '../types';
import { Card, PageHero, getButtonClassName } from '@/components/ui';

const sections = [
    { id: 'categories', label: '训练部位' },
    { id: 'exercises', label: '训练动作' },
] as const;

export default function SettingsClient() {
    const [activeId, setActiveId] = useState<(typeof sections)[number]['id']>('categories');
    const categories = useQuery({
        queryKey: ['system-configs', 'exercise_category'],
        queryFn: () => configApi.getAllByScope('exercise_category'),
    });
    const exercises = useQuery({
        queryKey: ['exercise-types-all'],
        queryFn: () => exerciseTypesApi.getAll(),
    });

    return (
        <div className="mx-auto max-w-5xl space-y-4 xl:space-y-5">
            <PageHero
                eyebrow="系统 / 配置"
                icon={<Settings size={18} className="text-accent" />}
                title="系统配置"
                description="管理训练部位、动作，以及笔记系统的 CLI 访问授权。"
            />

            <Card variant="subtle" className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                    <h2 className="text-body font-semibold text-text-primary">开发者访问</h2>
                    <p className="mt-1 text-body-sm text-text-secondary">查看与撤销已授权的 CLI 设备。</p>
                </div>
                <Link href="/developer" className={getButtonClassName({ variant: 'secondary', size: 'sm' })}>
                    <KeyRound size={16} />
                    管理设备授权
                </Link>
            </Card>

            <nav aria-label="健身配置" className="flex flex-wrap gap-2">
                {sections.map((section) => (
                    <button
                        key={section.id}
                        type="button"
                        aria-pressed={activeId === section.id}
                        onClick={() => setActiveId(section.id)}
                        className={getButtonClassName({
                            variant: activeId === section.id ? 'tinted' : 'secondary',
                            size: 'sm',
                        })}
                    >
                        {section.label}
                    </button>
                ))}
            </nav>

            {categories.isPending || (activeId === 'exercises' && exercises.isPending) ? (
                <Card variant="subtle" className="p-4 text-body-sm text-text-secondary">加载配置中...</Card>
            ) : categories.isError || (activeId === 'exercises' && exercises.isError) ? (
                <Card variant="subtle" className="space-y-3 p-4">
                    <p role="alert" className="text-body-sm text-danger">配置加载失败，请重试。</p>
                    <button
                        type="button"
                        onClick={() => {
                            void categories.refetch();
                            if (activeId === 'exercises') void exercises.refetch();
                        }}
                        className={getButtonClassName({ variant: 'secondary', size: 'sm' })}
                    >
                        重新加载
                    </button>
                </Card>
            ) : activeId === 'categories' ? (
                <ConfigScopeSection meta={CONFIG_SCOPES[0]} initialItems={categories.data ?? []} />
            ) : (
                <ExerciseManager
                    initialCategories={categories.data ?? []}
                    initialExercises={exercises.data ?? []}
                />
            )}
        </div>
    );
}
