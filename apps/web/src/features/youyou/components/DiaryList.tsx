'use client';

import { useState, useCallback } from 'react';
import { Plus, BookHeart, Search } from 'lucide-react';
import { useDiaryEntries } from '../hooks/useDiary';
import { DiaryCard } from './DiaryCard';
import { DiaryFormDialog } from './DiaryFormDialog';
import { MOOD_CONFIG } from '../types';
import type { DiaryMood, DiaryEntry } from '../types';
import { Button, Card, PageHero } from '@/components/ui';

export function DiaryList() {
    const [moodFilter, setMoodFilter] = useState<DiaryMood | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);

    const { data: entries = [], isLoading } = useDiaryEntries(50);

    const filtered = moodFilter
        ? entries.filter(e => e.mood === moodFilter)
        : entries;

    const handleAdd = useCallback(() => {
        setEditingEntry(null);
        setShowForm(true);
    }, []);

    const handleEdit = useCallback((entry: DiaryEntry) => {
        setEditingEntry(entry);
        setShowForm(true);
    }, []);

    const handleCloseForm = useCallback(() => {
        setShowForm(false);
        setEditingEntry(null);
    }, []);

    return (
        <div className="space-y-4 xl:space-y-5">
            <PageHero
                eyebrow="成长 / 又又"
                icon={<BookHeart size={18} />}
                title="成长日记"
                description="记录又又每一天的成长、趣事和变化。"
                action={
                    <Button onClick={handleAdd} variant="tinted" size="sm" className="gap-1">
                        <Plus size={16} />
                        写日记
                    </Button>
                }
                stats={[
                    {
                        label: '日记总数',
                        value: entries.length,
                        tone: 'accent',
                    },
                ]}
            >
                {/* Mood filter chips */}
                <div className="glass-filter-bar flex items-center">
                    <button
                        onClick={() => setMoodFilter(null)}
                        className={`glass-filter-chip text-caption ${!moodFilter ? 'glass-filter-chip-active' : ''}`}
                    >
                        全部
                    </button>
                    {(Object.keys(MOOD_CONFIG) as DiaryMood[]).map(mood => (
                        <button
                            key={mood}
                            onClick={() => setMoodFilter(moodFilter === mood ? null : mood)}
                            className={`glass-filter-chip text-caption ${moodFilter === mood ? 'glass-filter-chip-active' : ''}`}
                        >
                            {MOOD_CONFIG[mood].emoji} {MOOD_CONFIG[mood].label}
                        </button>
                    ))}
                </div>
            </PageHero>

            {/* Diary entries */}
            {isLoading ? (
                <Card variant="subtle" className="p-card text-body-sm text-text-secondary">
                    加载中...
                </Card>
            ) : filtered.length === 0 ? (
                <Card className="p-card-lg text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-glass-border bg-panel-bg">
                        {moodFilter ? <Search size={28} className="text-text-secondary" /> : <BookHeart size={28} className="text-text-secondary" />}
                    </div>
                    <p className="text-body text-text-primary">
                        {moodFilter ? '没有匹配的日记' : '还没有日记'}
                    </p>
                    <p className="mt-1 text-body-sm text-text-secondary">
                        {moodFilter
                            ? '试试其他心情筛选，或者清除筛选条件。'
                            : '记录又又的今天，留下珍贵的回忆。'}
                    </p>
                    {!moodFilter && (
                        <Button onClick={handleAdd} variant="tinted" size="sm" className="mt-4 gap-1">
                            <Plus size={16} />
                            写第一篇日记
                        </Button>
                    )}
                </Card>
            ) : (
                <div className="space-y-2">
                    {filtered.map(entry => (
                        <DiaryCard key={entry.id} entry={entry} onEdit={handleEdit} />
                    ))}
                </div>
            )}

            {/* Form dialog */}
            <DiaryFormDialog
                open={showForm}
                onClose={handleCloseForm}
                editingEntry={editingEntry}
            />
        </div>
    );
}
