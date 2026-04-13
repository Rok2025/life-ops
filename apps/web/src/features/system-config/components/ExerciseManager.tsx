'use client';

import { Dumbbell } from 'lucide-react';
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
        <Card variant="subtle" className="p-4">
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Dumbbell size={18} className="text-accent" />
                    <h3 className="text-body font-semibold text-text-primary">训练动作</h3>
                    <span className="glass-mini-chip text-caption">
                        {s.activeCategories.length} 部位 · {s.exercises.length} 动作
                    </span>
                </div>

                {/* Exercise list — always show */}
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
            </div>

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
