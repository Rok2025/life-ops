'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Settings } from 'lucide-react';
import { ConfigScopeSection } from './ConfigScopeSection';
import ExerciseManager from './ExerciseManager';
import { EnglishPromptManager } from '@/features/english-prompts';
import { YouyouPhotoSettings } from './YouyouPhotoSettings';
import { configApi } from '../api/configApi';
import { exerciseTypesApi } from '../api/exerciseTypesApi';
import { CONFIG_SCOPES, SETTINGS_NAV } from '../types';
import type { ConfigItem, SettingsSection } from '../types';
import { Card, PageHero } from '@/components/ui';

export default function SettingsClient() {
    const [activeId, setActiveId] = useState(SETTINGS_NAV[0].items[0].id);

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

    const totalConfigs = Object.values(initialData).reduce((s, arr) => s + arr.length, 0);

    // Find the active nav item's section
    const activeItem = SETTINGS_NAV.flatMap((g) => g.items).find((i) => i.id === activeId);
    const activeSection: SettingsSection = activeItem?.section ?? { type: 'scope', scope: 'til_category' };

    return (
        <div className="mx-auto max-w-5xl space-y-4 xl:space-y-5">
            <PageHero
                eyebrow="系统 / 配置"
                icon={<Settings size={18} className="text-accent" />}
                title="系统配置"
                description="统一管理分类、动作和英语提示词等底层配置，让全站词汇和选项保持一致。"
                stats={[
                    { label: '配置项', value: totalConfigs, meta: `${CONFIG_SCOPES.length} 个范围`, tone: 'accent' },
                    { label: '训练动作', value: initialExercises.length, meta: `${initialData['exercise_category']?.length ?? 0} 个部位`, tone: 'success' },
                    { label: '配置状态', value: '实时生效', meta: '改完即用', tone: 'warning' },
                ]}
            />

            <div className="flex gap-4 xl:gap-5">
                {/* Left navigation sidebar */}
                <Card variant="subtle" className="w-48 shrink-0 p-3 self-start sticky top-4">
                    <nav className="space-y-4">
                        {SETTINGS_NAV.map((group) => (
                            <div key={group.label}>
                                <h4 className="text-caption font-semibold text-text-tertiary uppercase tracking-wider mb-1.5 px-2">
                                    {group.label}
                                </h4>
                                <ul className="space-y-0.5">
                                    {group.items.map((item) => {
                                        const isActive = item.id === activeId;
                                        // Show count badge for scope-type items
                                        const count =
                                            item.section.type === 'scope'
                                                ? initialData[item.section.scope]?.length ?? 0
                                                : item.section.type === 'exercise'
                                                  ? initialExercises.length
                                                  : null;
                                        return (
                                            <li key={item.id}>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveId(item.id)}
                                                    className={[
                                                        'flex w-full items-center justify-between rounded-control px-2 py-1.5 text-body-sm transition-colors',
                                                        isActive
                                                            ? 'bg-accent/10 text-accent font-medium'
                                                            : 'text-text-secondary hover:bg-panel-bg hover:text-text-primary',
                                                    ].join(' ')}
                                                >
                                                    <span className="truncate">{item.label}</span>
                                                    {count != null && (
                                                        <span className={[
                                                            'text-caption tabular-nums ml-1',
                                                            isActive ? 'text-accent/70' : 'text-text-tertiary',
                                                        ].join(' ')}>
                                                            {count}
                                                        </span>
                                                    )}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
                    </nav>
                </Card>

                {/* Right content panel */}
                <div className="flex-1 min-w-0">
                    <SettingsContent
                        section={activeSection}
                        initialData={initialData}
                        initialExercises={initialExercises}
                    />
                </div>
            </div>
        </div>
    );
}

// ── Content dispatcher ────────────────────────────────────

function SettingsContent({
    section,
    initialData,
    initialExercises,
}: {
    section: SettingsSection;
    initialData: Record<string, ConfigItem[]>;
    initialExercises: ReturnType<typeof Array<unknown>>;
}) {
    if (section.type === 'scope') {
        const meta = CONFIG_SCOPES.find((s) => s.scope === section.scope);
        if (!meta) return null;
        return (
            <ConfigScopeSection
                key={meta.scope}
                meta={meta}
                initialItems={initialData[meta.scope] ?? []}
            />
        );
    }

    if (section.type === 'exercise') {
        return (
            <ExerciseManager
                initialCategories={initialData['exercise_category'] ?? []}
                initialExercises={initialExercises as never[]}
            />
        );
    }

    if (section.type === 'english-prompts') {
        return <EnglishPromptManager />;
    }

    if (section.type === 'youyou-photo') {
        return <YouyouPhotoSettings />;
    }

    return null;
}
