'use client';

import { useCallback } from 'react';
import { Check, Edit2, Trash2 } from 'lucide-react';
import type { Frog } from '../types';

interface FrogItemProps {
    frog: Frog;
    index: number;
    onToggle: (frog: Frog) => void;
    onEdit: (frog: Frog) => void;
    onDelete: (id: string) => void;
}

export function FrogItem({ frog, index, onToggle, onEdit, onDelete }: FrogItemProps) {
    const handleToggle = useCallback(() => onToggle(frog), [onToggle, frog]);
    const handleEdit = useCallback(() => onEdit(frog), [onEdit, frog]);
    const handleDelete = useCallback(() => onDelete(frog.id), [onDelete, frog.id]);

    return (
        <div
            className={`p-3 bg-bg-tertiary rounded-lg flex items-center gap-3 ${frog.is_completed ? 'opacity-60' : ''}`}
        >
            <button
                onClick={handleToggle}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${frog.is_completed
                        ? 'bg-success border-success text-white'
                        : 'border-border hover:border-accent'
                    }`}
            >
                {frog.is_completed && <Check size={14} />}
            </button>
            <div className="flex-1 min-w-0">
                <div
                    className={`font-medium truncate ${frog.is_completed ? 'line-through text-text-secondary' : 'text-text-primary'
                        }`}
                >
                    {index + 1}. {frog.title}
                </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={handleEdit} className="p-1.5 text-text-secondary hover:bg-bg-secondary rounded">
                    <Edit2 size={14} />
                </button>
                <button onClick={handleDelete} className="p-1.5 text-danger hover:bg-danger/10 rounded">
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}
