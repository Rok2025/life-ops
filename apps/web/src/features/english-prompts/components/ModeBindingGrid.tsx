'use client';

import { Select } from '@/components/ui';
import { ENGLISH_PROMPT_MODE_META } from '../types';
import type { EnglishPromptMode, EnglishPromptTemplate } from '../types';

export interface ModeBindingGridProps {
    bindingMap: Record<string, { template_id: string | null; template?: { title: string } | null }>;
    templateOptionsByMode: Record<EnglishPromptMode, EnglishPromptTemplate[]>;
    bindingsLoading: boolean;
    bindingPending: boolean;
    onBindingChange: (mode: EnglishPromptMode, templateId: string | null) => void;
}

export function ModeBindingGrid({
    bindingMap,
    templateOptionsByMode,
    bindingsLoading,
    bindingPending,
    onBindingChange,
}: ModeBindingGridProps) {
    return (
        <div className="grid gap-3 lg:grid-cols-3">
            {ENGLISH_PROMPT_MODE_META.map(meta => {
                const selectedBinding = bindingMap[meta.key];
                const options = templateOptionsByMode[meta.key] ?? [];

                return (
                    <div key={meta.key} className="rounded-inner-card border border-glass-border bg-panel-bg/78 p-3 space-y-2 shadow-sm">
                        <div>
                            <p className="text-body-sm font-medium text-text-primary">{meta.label}</p>
                            <p className="text-caption text-text-tertiary mt-1">{meta.description}</p>
                        </div>
                        <Select
                            value={selectedBinding?.template_id ?? ''}
                            onChange={event => onBindingChange(meta.key, event.target.value || null)}
                            disabled={bindingsLoading || bindingPending}
                        >
                            <option value="">使用内置默认提示词</option>
                            {options.map(template => (
                                <option key={template.id} value={template.id}>
                                    {template.title}{template.is_active ? '' : '（已停用）'}
                                </option>
                            ))}
                        </Select>
                        <p className="text-caption text-text-tertiary">
                            当前：{selectedBinding?.template?.title ?? '未绑定，自带默认提示词'}
                        </p>
                    </div>
                );
            })}
        </div>
    );
}
