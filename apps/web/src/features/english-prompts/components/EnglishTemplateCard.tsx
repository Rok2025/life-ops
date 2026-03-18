'use client';

import { Pencil, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { ENGLISH_PROMPT_MODE_META } from '../types';
import type { EnglishPromptTemplate } from '../types';

export interface EnglishTemplateCardProps {
    template: EnglishPromptTemplate;
    selectedModes: string[];
    onToggle: (id: string, isActive: boolean) => void;
    onEdit: (template: EnglishPromptTemplate) => void;
    onDelete: (template: EnglishPromptTemplate) => void;
}

export function EnglishTemplateCard({
    template,
    selectedModes,
    onToggle,
    onEdit,
    onDelete,
}: EnglishTemplateCardProps) {
    return (
        <div
            className={`glass-list-row px-4 py-3 ${
                template.is_active ? '' : 'opacity-70'
            }`}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                        <h5 className="text-body-sm font-medium text-text-primary">{template.title}</h5>
                        {template.supported_modes.map(mode => (
                            <span
                                key={mode}
                                className="text-caption px-2 py-0.5 rounded-full bg-accent/10 text-accent"
                            >
                                {ENGLISH_PROMPT_MODE_META.find(item => item.key === mode)?.label ?? mode}
                            </span>
                        ))}
                        {selectedModes.map(label => (
                            <span
                                key={`${template.id}-${label}`}
                                className="text-caption px-2 py-0.5 rounded-full bg-success/10 text-success"
                            >
                                当前绑定：{label}
                            </span>
                        ))}
                    </div>
                    {template.description && (
                        <p className="text-caption text-text-tertiary mt-1">{template.description}</p>
                    )}
                    <p className="text-caption text-text-secondary mt-2 max-h-20 overflow-hidden whitespace-pre-wrap">
                        {template.content}
                    </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <button
                        type="button"
                        onClick={() => onToggle(template.id, !template.is_active)}
                        className={`p-1 rounded-control transition-colors duration-normal ease-standard ${
                            template.is_active
                                ? 'text-success hover:bg-success/10'
                                : 'text-text-tertiary hover:bg-bg-secondary'
                        }`}
                        title={template.is_active ? '停用' : '启用'}
                    >
                        {template.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>
                    <button
                        type="button"
                        onClick={() => onEdit(template)}
                        className="p-1 rounded-control text-text-tertiary hover:text-text-primary hover:bg-bg-secondary transition-colors duration-normal ease-standard"
                        title="编辑"
                    >
                        <Pencil size={15} />
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(template)}
                        className="p-1 rounded-control text-text-tertiary hover:text-danger hover:bg-danger/10 transition-colors duration-normal ease-standard"
                        title="删除"
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            </div>
        </div>
    );
}
