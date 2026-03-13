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
            className={`glass-list-row flex items-center gap-2 px-3 py-2 ${frog.is_completed ? 'opacity-60' : ''}`}
        >
            <button
                onClick={handleToggle}
                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${frog.is_completed
                        ? 'bg-success border-success text-white'
                        : 'border-border hover:border-accent'
                    }`}
            >
                {frog.is_completed && <Check size={12} />}
            </button>
            <div className="flex-1 min-w-0">
                <div
                    className={`text-body-sm font-medium truncate ${frog.is_completed ? 'line-through text-text-secondary' : 'text-text-primary'
                        }`}
                >
                    {index + 1}. {frog.title}
                </div>
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
                <button onClick={handleEdit} className="rounded-control p-1 text-text-secondary transition-colors duration-normal ease-standard hover:bg-panel-bg hover:text-text-primary">
                    <Edit2 size={13} />
                </button>
                <button onClick={handleDelete} className="rounded-control p-1 text-danger transition-colors duration-normal ease-standard hover:bg-danger/10">
                    <Trash2 size={13} />
                </button>
            </div>
        </div>
    );
}
