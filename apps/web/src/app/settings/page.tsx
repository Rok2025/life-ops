import { Settings } from 'lucide-react';
import { configApi } from '@/features/system-config/api/configApi';
import { ConfigManager } from '@/features/system-config';
import { CONFIG_SCOPES } from '@/features/system-config/types';
import type { ConfigItem } from '@/features/system-config/types';
import ExerciseManager from '@/features/system-config/components/ExerciseManager';
import { supabase } from '@/lib/supabase';

export default async function SettingsPage() {
    // Server Component: 预加载所有 scope 的配置数据
    const initialData: Record<string, ConfigItem[]> = {};

    // 过滤掉 exercise_category，它由 ExerciseManager 统一管理
    const generalScopes = CONFIG_SCOPES.filter(s => s.scope !== 'exercise_category');

    await Promise.all(
        CONFIG_SCOPES.map(async (meta) => {
            try {
                initialData[meta.scope] = await configApi.getAllByScope(meta.scope);
            } catch {
                initialData[meta.scope] = [];
            }
        })
    );

    // 预加载动作类型数据
    let initialExercises: { id: string; name: string; category: string; tracking_mode: string; default_unit: string | null }[] = [];
    try {
        const { data } = await supabase
            .from('exercise_types')
            .select('*')
            .order('category')
            .order('name');
        initialExercises = data ?? [];
    } catch {
        // ignore
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <Settings size={24} className="text-text-secondary" />
                <h1 className="text-2xl font-bold text-text-primary">系统配置</h1>
            </div>
            <p className="text-text-secondary mb-8">
                管理系统中的分类、类型等可配置项。修改后会即时生效。
            </p>
            <div className="space-y-6">
                <ConfigManager scopes={generalScopes} initialData={initialData} />
                <ExerciseManager
                    initialCategories={initialData['exercise_category'] ?? []}
                    initialExercises={initialExercises}
                />
            </div>
        </div>
    );
}
