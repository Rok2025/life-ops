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
        <div className="glass-list-row flex items-center gap-2 px-3 py-2">
            <div className="flex-1 min-w-0 flex items-center">
                {til.category && (
                    <span className="mr-2 shrink-0 rounded-full border border-warning/20 bg-warning/12 px-2 py-0.5 text-caption text-warning">
                        {til.category}
                    </span>
                )}
                <span className="text-body-sm text-text-primary truncate">{til.content}</span>
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
                <button onClick={() => onEdit(til)} className="rounded-control p-1 text-text-secondary transition-colors duration-normal ease-standard hover:bg-panel-bg hover:text-text-primary">
                    <Edit2 size={13} />
                </button>
                <button onClick={() => onDelete(til.id)} className="rounded-control p-1 text-danger transition-colors duration-normal ease-standard hover:bg-danger/10">
                    <Trash2 size={13} />
                </button>
            </div>
        </div>
    );
}
