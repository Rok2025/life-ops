import { Plus, Edit2, Check, X, Trash2 } from 'lucide-react';
import type { ExerciseType } from '../hooks/useExerciseManagerState';
import { Button, Input } from '@/components/ui';

interface ExerciseListPanelProps {
    exercises: ExerciseType[];
    allCatValues: string[];
    categoryLabels: Record<string, string>;
    exercisesByCategory: Record<string, ExerciseType[]>;
    displayCategories: string[];
    selectedCategory: string | null;
    onCategoryChange: (cat: string | null) => void;
    onShowAddForm: () => void;
    editingId: string | null;
    editName: string;
    onStartEdit: (id: string, name: string) => void;
    onEditNameChange: (name: string) => void;
    onSaveEdit: (id: string) => void;
    onCancelEdit: () => void;
    onDelete: (id: string, name: string) => void;
}

export function ExerciseListPanel({
    allCatValues,
    categoryLabels,
    exercisesByCategory,
    displayCategories,
    selectedCategory,
    onCategoryChange,
    onShowAddForm,
    editingId,
    editName,
    onStartEdit,
    onEditNameChange,
    onSaveEdit,
    onCancelEdit,
    onDelete,
}: ExerciseListPanelProps) {
    return (
        <div className="space-y-4">
            {/* Category filter + Add */}
            <div className="flex items-center justify-between gap-3">
                <div className="glass-filter-bar flex flex-1 flex-wrap items-center">
                    <button
                        onClick={() => onCategoryChange(null)}
                        className={`glass-filter-chip text-caption ${
                            selectedCategory === null
                                ? 'glass-filter-chip-active font-medium'
                                : ''
                        }`}
                    >
                        全部
                    </button>
                    {allCatValues.map(cat => (
                        <button
                            key={cat}
                            onClick={() => onCategoryChange(cat)}
                            className={`glass-filter-chip text-caption ${
                                selectedCategory === cat
                                    ? 'glass-filter-chip-active font-medium'
                                    : ''
                            }`}
                        >
                            {categoryLabels[cat] || cat}
                        </button>
                    ))}
                </div>
                <Button onClick={onShowAddForm} variant="tinted" size="sm" className="gap-1 shrink-0">
                    <Plus size={14} />
                    添加
                </Button>
            </div>

            {/* Exercise list by category */}
            <div className="space-y-4">
                {displayCategories.map(category => (
                    <div key={category}>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-accent" />
                            <span className="text-body-sm font-medium text-text-primary">
                                {categoryLabels[category] || category}
                            </span>
                            <span className="text-caption text-text-tertiary">
                                ({exercisesByCategory[category]?.length || 0})
                            </span>
                        </div>
                        <div className="space-y-1.5">
                            {exercisesByCategory[category]?.map(exercise => (
                                <div
                                    key={exercise.id}
                                    className="glass-list-row flex items-center justify-between px-3 py-2"
                                >
                                    {editingId === exercise.id ? (
                                        <Input
                                            type="text"
                                            value={editName}
                                            onChange={e => onEditNameChange(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') onSaveEdit(exercise.id); }}
                                            size="sm"
                                            className="mr-2 flex-1 bg-card-bg"
                                            autoFocus
                                        />
                                    ) : (
                                        <span className="text-body-sm text-text-primary">{exercise.name}</span>
                                    )}
                                    <div className="flex items-center gap-1">
                                        {editingId === exercise.id ? (
                                            <>
                                                <button
                                                    onClick={() => onSaveEdit(exercise.id)}
                                                    className="p-1 text-success hover:bg-success/10 rounded-control transition-colors duration-normal ease-standard"
                                                >
                                                    <Check size={14} />
                                                </button>
                                                <button
                                                    onClick={onCancelEdit}
                                                    className="rounded-control p-1 text-text-secondary transition-colors duration-normal ease-standard hover:bg-panel-bg"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => onStartEdit(exercise.id, exercise.name)}
                                                    className="rounded-control p-1 text-text-tertiary transition-colors duration-normal ease-standard hover:bg-panel-bg hover:text-text-secondary"
                                                >
                                                    <Edit2 size={13} />
                                                </button>
                                                <button
                                                    onClick={() => onDelete(exercise.id, exercise.name)}
                                                    className="p-1 text-text-tertiary hover:text-danger hover:bg-danger/10 rounded-control transition-colors duration-normal ease-standard"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                {displayCategories.length === 0 && (
                    <div className="rounded-lg border border-dashed border-glass-border bg-panel-bg/65 px-4 py-5 text-center text-body-sm text-text-tertiary">
                        暂无动作
                    </div>
                )}
            </div>
        </div>
    );
}
