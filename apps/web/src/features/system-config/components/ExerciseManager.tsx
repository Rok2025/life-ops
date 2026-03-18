'use client';

import { ChevronDown, ChevronUp, Dumbbell } from 'lucide-react';
import { useExerciseManagerState, type ExerciseType } from '../hooks/useExerciseManagerState';
import { ExerciseListPanel } from './ExerciseListPanel';
import { CategoryListPanel } from './CategoryListPanel';
import { AddExerciseDialog } from './AddExerciseDialog';
import type { ConfigItem } from '../types';
import { Card } from '@/components/ui';

interface ExerciseManagerProps {
    initialCategories: ConfigItem[];
    initialExercises: ExerciseType[];
}

export default function ExerciseManager({ initialCategories, initialExercises }: ExerciseManagerProps) {
    const s = useExerciseManagerState(initialCategories, initialExercises);

    return (
        <Card variant="subtle" className="overflow-hidden p-0">
            {/* Header */}
            <button
                onClick={() => s.setExpanded(v => !v)}
                className="flex w-full items-center justify-between p-4 transition-colors duration-normal ease-standard hover:bg-panel-bg/90"
            >
                <div className="flex items-center gap-3">
                    <Dumbbell size={18} className="text-accent" />
                    <h3 className="text-body font-semibold text-text-primary">训练配置</h3>
                    <span className="glass-mini-chip text-caption">
                        {s.activeCategories.length} 部位 · {s.exercises.length} 动作
                    </span>
                </div>
                {s.expanded
                    ? <ChevronUp size={18} className="text-text-secondary" />
                    : <ChevronDown size={18} className="text-text-secondary" />}
            </button>

            {s.expanded && (
                <div className="px-4 pb-4">
                    {/* Tab 切换 */}
                    <div className="mb-4">
                        <div className="glass-filter-bar inline-flex items-center">
                            <button
                                onClick={() => s.setTab('exercises')}
                                className={`glass-filter-chip text-body-sm ${
                                    s.tab === 'exercises'
                                        ? 'glass-filter-chip-active font-medium text-text-primary'
                                        : ''
                                }`}
                            >
                                训练动作
                                <span className="ml-1.5 text-caption text-text-tertiary">({s.exercises.length})</span>
                            </button>
                            <button
                                onClick={() => s.setTab('categories')}
                                className={`glass-filter-chip text-body-sm ${
                                    s.tab === 'categories'
                                        ? 'glass-filter-chip-active font-medium text-text-primary'
                                        : ''
                                }`}
                            >
                                训练部位
                                <span className="ml-1.5 text-caption text-text-tertiary">({s.activeCategories.length}/{s.categories.length})</span>
                            </button>
                        </div>
                    </div>

                    {s.tab === 'exercises' && (
                        <ExerciseListPanel
                            exercises={s.exercises}
                            allCatValues={s.allCatValues}
                            categoryLabels={s.categoryLabels}
                            exercisesByCategory={s.exercisesByCategory}
                            displayCategories={s.displayCategories}
                            selectedCategory={s.selectedCategory}
                            onCategoryChange={s.setSelectedCategory}
                            onShowAddForm={() => s.setShowAddForm(true)}
                            editingId={s.editingId}
                            editName={s.editName}
                            onStartEdit={(id, name) => { s.setEditingId(id); s.setEditName(name); }}
                            onEditNameChange={s.setEditName}
                            onSaveEdit={s.handleUpdateExercise}
                            onCancelEdit={() => s.setEditingId(null)}
                            onDelete={s.handleDeleteExercise}
                        />
                    )}

                    {s.tab === 'categories' && (
                        <CategoryListPanel
                            categories={s.categories}
                            exercisesByCategory={s.exercisesByCategory}
                            editingCatId={s.editingCatId}
                            editCatLabel={s.editCatLabel}
                            newCatLabel={s.newCatLabel}
                            onStartEdit={s.handleStartEditCategory}
                            onEditLabelChange={s.setEditCatLabel}
                            onSaveEdit={s.handleSaveEditCategory}
                            onCancelEdit={() => s.setEditingCatId(null)}
                            onToggle={(id, isActive) => s.toggleCatMutation.mutate({ id, isActive })}
                            onDelete={s.handleDeleteCategory}
                            isDeletePending={s.isDeleteCatPending}
                            onNewLabelChange={s.setNewCatLabel}
                            onAdd={s.handleAddCategory}
                            isAddPending={s.isAddCatPending}
                        />
                    )}
                </div>
            )}

            <AddExerciseDialog
                open={s.showAddForm}
                onClose={() => s.setShowAddForm(false)}
                allCatValues={s.allCatValues}
                categoryLabels={s.categoryLabels}
                effectiveCategory={s.effectiveNewCategory}
                onCategoryChange={s.setNewCategory}
                newName={s.newName}
                onNameChange={s.setNewName}
                onSubmit={() => void s.handleAddExercise()}
                saving={s.saving}
            />
        </Card>
    );
}
