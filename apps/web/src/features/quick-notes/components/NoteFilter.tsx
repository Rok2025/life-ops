'use client';

import type { FilterType, NoteType } from '../types';
import { NOTE_TYPE_CONFIG, NOTE_TYPES } from '../types';

interface NoteFilterProps {
    filter: FilterType;
    counts: Record<FilterType, number>;
    onFilterChange: (filter: FilterType) => void;
}

export function NoteFilter({ filter, counts, onFilterChange }: NoteFilterProps) {
    return (
        <div className="flex items-center gap-1 mb-4 bg-bg-tertiary rounded-lg p-1">
            <button
                onClick={() => onFilterChange('all')}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${filter === 'all'
                        ? 'bg-bg-secondary text-text-primary font-medium shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
            >
                全部 {counts.all > 0 && <span className="ml-1 text-xs opacity-70">{counts.all}</span>}
            </button>
            {NOTE_TYPES.map(type => {
                const config = NOTE_TYPE_CONFIG[type];
                return (
                    <button
                        key={type}
                        onClick={() => onFilterChange(type)}
                        className={`px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1 ${filter === type
                                ? 'bg-bg-secondary text-text-primary font-medium shadow-sm'
                                : 'text-text-secondary hover:text-text-primary'
                            }`}
                    >
                        <span>{config.emoji}</span>
                        {config.label}
                        {counts[type] > 0 && <span className="text-xs opacity-70">{counts[type]}</span>}
                    </button>
                );
            })}
        </div>
    );
}
