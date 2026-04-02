'use client';

import type { FilterType } from '../types';
import { NOTE_TYPE_CONFIG, NOTE_TYPES } from '../types';
import type { NoteType } from '../types';

interface NoteFilterProps {
    filter: FilterType;
    counts: Record<FilterType, number>;
    onFilterChange: (filter: FilterType) => void;
    types?: readonly NoteType[];
}

export function NoteFilter({ filter, counts, onFilterChange, types = NOTE_TYPES }: NoteFilterProps) {
    return (
        <div className="glass-filter-bar flex items-center">
            <button
                onClick={() => onFilterChange('all')}
                className={`glass-filter-chip text-body-sm ${filter === 'all'
                        ? 'glass-filter-chip-active font-medium'
                        : ''
                    }`}
            >
                全部 {counts.all > 0 && <span className="ml-1 text-caption opacity-70">{counts.all}</span>}
            </button>
            {types.map(type => {
                const config = NOTE_TYPE_CONFIG[type];
                return (
                    <button
                        key={type}
                        onClick={() => onFilterChange(type)}
                        className={`glass-filter-chip text-body-sm ${filter === type
                                ? 'glass-filter-chip-active font-medium'
                                : ''
                            }`}
                    >
                        <span>{config.emoji}</span>
                        {config.label}
                        {counts[type] > 0 && <span className="text-caption opacity-70">{counts[type]}</span>}
                    </button>
                );
            })}
        </div>
    );
}
