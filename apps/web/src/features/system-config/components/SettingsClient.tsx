'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Settings } from 'lucide-react';
import ConfigManager from './ConfigManager';
import ExerciseManager from './ExerciseManager';
import { EnglishPromptManager } from '@/features/english-prompts';
import { configApi } from '../api/configApi';
import { exerciseTypesApi } from '../api/exerciseTypesApi';
import { CONFIG_SCOPES } from '../types';
import type { ConfigItem } from '../types';
import { Card, PageHero } from '@/components/ui';

export default function SettingsClient() {
    const generalScopes = useMemo(
        () => CONFIG_SCOPES.filter(s => s.scope !== 'exercise_category'),
        [],
    );

    const { data: initialData = {}, isLoading: configLoading } = useQuery({
        queryKey: ['system-configs-all'],
        queryFn: async (): Promise<Record<string, ConfigItem[]>> => {
            const pairs = await Promise.all(
                CONFIG_SCOPES.map(async (meta) => {
                    try {
                        const items = await configApi.getAllByScope(meta.scope);
                        return [meta.scope, items] as const;
                    } catch {
                        return [meta.scope, []] as const;
                    }
                }),
            );
            return Object.fromEntries(pairs);
        },
    });

    const { data: initialExercises = [], isLoading: exerciseLoading } = useQuery({
        queryKey: ['exercise-types-all'],
        queryFn: () => exerciseTypesApi.getAll(),
    });

    if (configLoading || exerciseLoading) {
        return (
            <div className="mx-auto max-w-5xl">
                <Card variant="subtle" className="p-card text-body-sm text-text-secondary">
                    加载配置中...
                </Card>
            </div>
        );
    }

    const generalItemCount = generalScopes.reduce(
        (sum, scope) => sum + (initialData[scope.scope]?.length ?? 0),
        0,
    );
    const categoryCount = initialData['exercise_category']?.length ?? 0;

    return (
        <div className="mx-auto max-w-5xl space-y-4 xl:space-y-5">
            <PageHero
                eyebrow="系统 / 配置"
                icon={<Settings size={18} className="text-accent" />}
                title="系统配置"
                description="统一管理分类、动作和英语提示词等底层配置，让全站词汇和选项保持一致。"
                stats={[
                    { label: '通用配置项', value: generalItemCount, meta: `${generalScopes.length} 个范围`, tone: 'accent' },
                    { label: '训练动作', value: initialExercises.length, meta: `${categoryCount} 个部位`, tone: 'success' },
                    { label: '配置状态', value: '实时生效', meta: '改完即用', tone: 'warning' },
                ]}
            />

            <div className="space-y-4 xl:space-y-5">
                <ConfigManager scopes={generalScopes} initialData={initialData} />
                <ExerciseManager
                    initialCategories={initialData['exercise_category'] ?? []}
                    initialExercises={initialExercises}
                />
                <EnglishPromptManager />
            </div>
        </div>
    );
}
