'use client';

import { GripVertical, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import type { ConfigItem } from '../types';

interface ConfigItemRowProps {
    item: ConfigItem;
    onToggle: (id: string, isActive: boolean) => void;
    onDelete: (id: string) => void;
    deleting: boolean;
}

export function ConfigItemRow({ item, onToggle, onDelete, deleting }: ConfigItemRowProps) {
    return (
        <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                item.is_active
                    ? 'border-border bg-bg-tertiary'
                    : 'border-border/50 bg-bg-tertiary/50 opacity-60'
            }`}
        >
            <GripVertical size={14} className="text-text-tertiary flex-shrink-0 cursor-grab" />

            <span className={`flex-1 text-sm ${item.is_active ? 'text-text-primary' : 'text-text-secondary line-through'}`}>
                {item.label}
            </span>

            <button
                onClick={() => onToggle(item.id, !item.is_active)}
                className={`p-1 rounded transition-colors ${
                    item.is_active
                        ? 'text-success hover:bg-success/10'
                        : 'text-text-tertiary hover:bg-bg-secondary'
                }`}
                title={item.is_active ? '停用' : '启用'}
            >
                {item.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
            </button>

            <button
                onClick={() => onDelete(item.id)}
                disabled={deleting}
                className="p-1 text-text-tertiary hover:text-danger hover:bg-danger/10 rounded transition-colors disabled:opacity-50"
                title="删除"
            >
                <Trash2 size={14} />
            </button>
        </div>
    );
}
