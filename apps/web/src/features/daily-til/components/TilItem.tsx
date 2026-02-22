'use client';

import { Edit2, Trash2 } from 'lucide-react';
import type { TIL } from '../types';

interface TilItemProps {
    til: TIL;
    onEdit: (til: TIL) => void;
    onDelete: (id: string) => void;
}

export function TilItem({ til, onEdit, onDelete }: TilItemProps) {
    return (
        <div className="p-3 bg-bg-tertiary rounded-lg flex items-start gap-3">
            <div className="flex-1 min-w-0">
                {til.category && (
                    <span className="text-xs px-2 py-0.5 rounded bg-warning/20 text-warning mr-2">
                        {til.category}
                    </span>
                )}
                <span className="text-text-primary">{til.content}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => onEdit(til)} className="p-1.5 text-text-secondary hover:bg-bg-secondary rounded">
                    <Edit2 size={14} />
                </button>
                <button onClick={() => onDelete(til.id)} className="p-1.5 text-danger hover:bg-danger/10 rounded">
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}
