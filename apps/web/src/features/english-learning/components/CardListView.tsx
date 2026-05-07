'use client';

import { useState, useCallback } from 'react';
import { Search, Trash2, X } from 'lucide-react';
import { DIFFICULTY_CONFIG, FAMILIARITY_LABELS } from '../constants';
import { useEnglishCards } from '../hooks/useEnglishCards';
import { useEnglishMutations } from '../hooks/useEnglishMutations';
import type { CardFilters, Difficulty, Familiarity } from '../types';
import { Card, Input, SectionHeader } from '@/components/ui';
import PronunciationButton from './PronunciationButton';

const DIFFICULTY_OPTIONS: (Difficulty | '')[] = ['', 'easy', 'medium', 'hard'];

export default function CardListView() {
    const [filters, setFilters] = useState<CardFilters>({});
    const [searchInput, setSearchInput] = useState('');
    const { data: cards = [], isLoading } = useEnglishCards(filters);
    const { deleteCardMutation } = useEnglishMutations();

    const handleSearch = useCallback(() => {
        setFilters(f => ({ ...f, search: searchInput.trim() || undefined }));
    }, [searchInput]);

    const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    }, [handleSearch]);

    const handleDifficultyFilter = useCallback((d: Difficulty | '') => {
        setFilters(f => ({ ...f, difficulty: d || undefined }));
    }, []);

    const handleClearFilters = useCallback(() => {
        setFilters({});
        setSearchInput('');
    }, []);

    const handleDelete = useCallback((id: string) => {
        if (!confirm('确定删除这张卡片？')) return;
        deleteCardMutation.mutate(id);
    }, [deleteCardMutation]);

    const hasFilters = filters.search || filters.difficulty || filters.familiarity !== undefined;

    return (
        <Card className="p-card space-y-4">
            <SectionHeader
                title="📚 卡片库"
                description={`当前共 ${cards.length} 张卡片`}
            />

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <Input
                        type="text"
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        placeholder="搜索卡片..."
                        className="pl-8 pr-3"
                    />
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                </div>

                {/* Difficulty Filter */}
                <div className="glass-filter-bar">
                    {DIFFICULTY_OPTIONS.map(d => (
                        <button
                            key={d || 'all'}
                            onClick={() => handleDifficultyFilter(d)}
                            className={`glass-filter-chip text-caption ${
                                (filters.difficulty ?? '') === d
                                    ? 'glass-filter-chip-active font-medium text-text-primary'
                                    : ''
                            }`}
                        >
                            {d ? DIFFICULTY_CONFIG[d].label : '全部'}
                        </button>
                    ))}
                </div>

                {hasFilters && (
                    <button
                        onClick={handleClearFilters}
                        className="glass-mini-chip text-caption transition-colors duration-normal ease-standard hover:bg-card-bg"
                    >
                        <X size={12} /> 清除
                    </button>
                )}
            </div>

            {/* Card List */}
            {isLoading ? (
                <div className="text-center py-6 text-text-secondary">加载中...</div>
            ) : cards.length === 0 ? (
                <div className="text-center py-6 text-text-secondary">
                    <p className="text-body-sm">
                        {hasFilters ? '没有匹配的卡片' : '还没有学习卡片，去查个单词吧'}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {cards.map(card => {
                        const diffConfig = DIFFICULTY_CONFIG[card.difficulty] ?? DIFFICULTY_CONFIG.medium;
                        return (
                            <div
                                key={card.id}
                                className="glass-list-row flex items-center justify-between px-3 py-2.5"
                            >
                                <div className="flex-1 min-w-0 mr-3">
                                    <div className="flex min-w-0 items-center gap-2">
                                        <span className="min-w-0 truncate text-body-sm font-medium text-text-primary">
                                            {card.front_text}
                                        </span>
                                        <PronunciationButton
                                            text={card.front_text}
                                            size={13}
                                            className="h-6 w-6"
                                        />
                                        {card.phonetic && (
                                            <span className="text-caption text-text-tertiary shrink-0">
                                                {card.phonetic}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-caption text-text-secondary truncate mt-0.5">
                                        {card.back_text.split('\n')[0]}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className={`text-caption px-1.5 py-0.5 rounded-control ${diffConfig.color} bg-panel-bg`}>
                                        {diffConfig.label}
                                    </span>
                                    <span className="text-caption text-text-tertiary">
                                        {FAMILIARITY_LABELS[card.familiarity as Familiarity]}
                                    </span>
                                    <button
                                        onClick={() => handleDelete(card.id)}
                                        className="p-1 text-text-tertiary hover:text-danger rounded transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
}
