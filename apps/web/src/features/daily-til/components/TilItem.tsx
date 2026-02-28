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
        <div className="py-1.5 px-3 bg-bg-tertiary rounded-lg flex items-center gap-2">
            <div className="flex-1 min-w-0 flex items-center">
                {til.category && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-warning/20 text-warning mr-2 shrink-0">
                        {til.category}
                    </span>
                )}
                <span className="text-sm text-text-primary truncate">{til.content}</span>
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
                <button onClick={() => onEdit(til)} className="p-1 text-text-secondary hover:bg-bg-secondary rounded">
                    <Edit2 size={13} />
                </button>
                <button onClick={() => onDelete(til.id)} className="p-1 text-danger hover:bg-danger/10 rounded">
                    <Trash2 size={13} />
                </button>
            </div>
        </div>
    );
}
