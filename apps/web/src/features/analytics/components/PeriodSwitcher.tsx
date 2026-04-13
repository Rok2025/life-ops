'use client';

import type { AnalyticsPeriod } from '../types';

const PERIOD_OPTIONS: Array<{ key: AnalyticsPeriod; label: string }> = [
    { key: 'week', label: '本周' },
    { key: '30d', label: '近 30 天' },
];

export default function PeriodSwitcher({
    value,
    onChange,
}: {
    value: AnalyticsPeriod;
    onChange: (period: AnalyticsPeriod) => void;
}) {
    return (
        <div className="glass-filter-bar flex items-center">
            {PERIOD_OPTIONS.map((option) => (
                <button
                    key={option.key}
                    type="button"
                    onClick={() => onChange(option.key)}
                    className={`glass-filter-chip text-body-sm ${value === option.key ? 'glass-filter-chip-active font-medium text-text-primary' : ''}`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}
