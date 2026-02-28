'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Settings } from 'lucide-react';
import ConfigManager from './ConfigManager';
import ExerciseManager from './ExerciseManager';
import { configApi } from '../api/configApi';
import { exerciseTypesApi } from '../api/exerciseTypesApi';
import { CONFIG_SCOPES } from '../types';
import type { ConfigItem } from '../types';

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
            <div className="max-w-2xl mx-auto">
                <div className="text-text-secondary">加载配置中...</div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-section">
                <Settings size={20} className="text-text-secondary" />
                <h1 className="text-xl font-bold text-text-primary">系统配置</h1>
            </div>
            <p className="text-text-secondary mb-section">
                管理系统中的分类、类型等可配置项。修改后会即时生效。
            </p>
            <div className="space-y-section">
                <ConfigManager scopes={generalScopes} initialData={initialData} />
                <ExerciseManager
                    initialCategories={initialData['exercise_category'] ?? []}
                    initialExercises={initialExercises}
                />
            </div>
        </div>
    );
}
