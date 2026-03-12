'use client';

import { useState, useCallback } from 'react';
import { Search, Trash2, X } from 'lucide-react';
import { DIFFICULTY_CONFIG, FAMILIARITY_LABELS } from '../constants';
import { useEnglishCards } from '../hooks/useEnglishCards';
import { useEnglishMutations } from '../hooks/useEnglishMutations';
import type { CardFilters, Difficulty, Familiarity } from '../types';

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
        <div className="card p-card space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary">📚 卡片库</h3>
                <span className="text-sm text-text-tertiary">{cards.length} 张卡片</span>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <input
                        type="text"
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        placeholder="搜索卡片..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-bg-primary text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                </div>

                {/* Difficulty Filter */}
                <div className="flex gap-1 bg-bg-tertiary rounded-lg p-0.5">
                    {DIFFICULTY_OPTIONS.map(d => (
                        <button
                            key={d || 'all'}
                            onClick={() => handleDifficultyFilter(d)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                (filters.difficulty ?? '') === d
                                    ? 'bg-bg-primary text-text-primary shadow-sm'
                                    : 'text-text-secondary hover:text-text-primary'
                            }`}
                        >
                            {d ? DIFFICULTY_CONFIG[d].label : '全部'}
                        </button>
                    ))}
                </div>

                {hasFilters && (
                    <button
                        onClick={handleClearFilters}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs text-text-secondary hover:text-text-primary"
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
                    <p className="text-sm">
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
                                className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border hover:bg-bg-tertiary/50 transition-colors"
                            >
                                <div className="flex-1 min-w-0 mr-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-text-primary truncate">
                                            {card.front_text}
                                        </span>
                                        {card.phonetic && (
                                            <span className="text-xs text-text-tertiary shrink-0">
                                                {card.phonetic}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-text-secondary truncate mt-0.5">
                                        {card.back_text.split('\n')[0]}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${diffConfig.color} bg-bg-tertiary`}>
                                        {diffConfig.label}
                                    </span>
                                    <span className="text-xs text-text-tertiary">
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
        </div>
    );
}
