import { Plus, Edit2, Check, X, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import type { ExerciseType } from '../hooks/useExerciseManagerState';
import type { ConfigItem } from '../types';
import { Button, Input } from '@/components/ui';

interface CategoryListPanelProps {
    categories: ConfigItem[];
    exercisesByCategory: Record<string, ExerciseType[]>;
    editingCatId: string | null;
    editCatLabel: string;
    newCatLabel: string;
    onStartEdit: (cat: ConfigItem) => void;
    onEditLabelChange: (label: string) => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
    onToggle: (id: string, isActive: boolean) => void;
    onDelete: (id: string) => void;
    isDeletePending: boolean;
    onNewLabelChange: (label: string) => void;
    onAdd: () => void;
    isAddPending: boolean;
}

export function CategoryListPanel({
    categories,
    exercisesByCategory,
    editingCatId,
    editCatLabel,
    newCatLabel,
    onStartEdit,
    onEditLabelChange,
    onSaveEdit,
    onCancelEdit,
    onToggle,
    onDelete,
    isDeletePending,
    onNewLabelChange,
    onAdd,
    isAddPending,
}: CategoryListPanelProps) {
    return (
        <div className="space-y-3">
            <p className="text-body-sm text-text-tertiary">管理健身训练的肌群分类。停用后对应部位不再显示。</p>

            {/* Category list */}
            <div className="space-y-2">
                {categories.map(cat => (
                    <div
                        key={cat.id}
                        className={`glass-list-row flex items-center gap-3 px-3 py-2.5 ${
                            cat.is_active ? '' : 'opacity-60'
                        }`}
                    >
                        {editingCatId === cat.id ? (
                            <Input
                                type="text"
                                value={editCatLabel}
                                onChange={e => onEditLabelChange(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') onSaveEdit(); if (e.key === 'Escape') onCancelEdit(); }}
                                size="sm"
                                className="mr-2 flex-1 bg-card-bg"
                                autoFocus
                            />
                        ) : (
                            <span className={`flex-1 text-body-sm ${cat.is_active ? 'text-text-primary' : 'text-text-secondary line-through'}`}>
                                {cat.label}
                            </span>
                        )}
                        <span className="text-caption text-text-tertiary">
                            {exercisesByCategory[cat.value]?.length ?? 0} 个动作
                        </span>
                        <div className="flex items-center gap-1">
                            {editingCatId === cat.id ? (
                                <>
                                    <button
                                        onClick={onSaveEdit}
                                        className="p-1 text-success hover:bg-success/10 rounded-control transition-colors duration-normal ease-standard"
                                        title="保存"
                                    >
                                        <Check size={14} />
                                    </button>
                                    <button
                                        onClick={onCancelEdit}
                                        className="rounded-control p-1 text-text-secondary transition-colors duration-normal ease-standard hover:bg-panel-bg"
                                        title="取消"
                                    >
                                        <X size={14} />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => onStartEdit(cat)}
                                        className="rounded-control p-1 text-text-tertiary transition-colors duration-normal ease-standard hover:bg-panel-bg hover:text-text-secondary"
                                        title="编辑"
                                    >
                                        <Edit2 size={13} />
                                    </button>
                                    <button
                                        onClick={() => onToggle(cat.id, !cat.is_active)}
                                        className={`p-1 rounded-control transition-colors duration-normal ease-standard ${
                                            cat.is_active
                                                ? 'text-success hover:bg-success/10'
                                                : 'text-text-tertiary hover:bg-panel-bg'
                                        }`}
                                        title={cat.is_active ? '停用' : '启用'}
                                    >
                                        {cat.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                    </button>
                                    <button
                                        onClick={() => onDelete(cat.id)}
                                        disabled={isDeletePending}
                                        className="p-1 text-text-tertiary hover:text-danger hover:bg-danger/10 rounded-control transition-colors duration-normal ease-standard disabled:opacity-50"
                                        title="删除"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
                {categories.length === 0 && (
                    <div className="rounded-lg border border-dashed border-glass-border bg-panel-bg/65 px-4 py-5 text-center text-body-sm text-text-tertiary">
                        暂无部位
                    </div>
                )}
            </div>

            {/* Add new category */}
            <div className="flex gap-2">
                <Input
                    type="text"
                    value={newCatLabel}
                    onChange={e => onNewLabelChange(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAdd(); } }}
                    placeholder="输入新部位名称..."
                    className="flex-1"
                />
                <Button onClick={onAdd} disabled={!newCatLabel.trim() || isAddPending} variant="tinted" size="sm" className="gap-1">
                    <Plus size={14} />
                    添加
                </Button>
            </div>
        </div>
    );
}
