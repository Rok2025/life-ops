'use client';

import { useState, useCallback } from 'react';
import { RotateCcw, ArrowRight, Inbox } from 'lucide-react';
import { DIFFICULTY_CONFIG, FAMILIARITY_LABELS } from '../constants';
import { useCardsForReview } from '../hooks/useEnglishCards';
import { useEnglishMutations } from '../hooks/useEnglishMutations';
import type { Familiarity, EnglishCard } from '../types';

const REVIEW_BUTTONS: { familiarity: Familiarity; label: string; color: string }[] = [
    { familiarity: 0, label: '完全不记得', color: 'bg-danger/10 text-danger hover:bg-danger/20' },
    { familiarity: 1, label: '很模糊', color: 'bg-warning/10 text-warning hover:bg-warning/20' },
    { familiarity: 2, label: '有点印象', color: 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20' },
    { familiarity: 3, label: '基本记得', color: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20' },
    { familiarity: 4, label: '很熟悉', color: 'bg-success/10 text-success hover:bg-success/20' },
    { familiarity: 5, label: '完全掌握', color: 'bg-accent/10 text-accent hover:bg-accent/20' },
];

export default function FlashcardReview() {
    const { data: reviewCards = [], isLoading } = useCardsForReview();
    const { reviewCardMutation } = useEnglishMutations();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [reviewedCount, setReviewedCount] = useState(0);

    const currentCard: EnglishCard | undefined = reviewCards[currentIndex];
    const totalCards = reviewCards.length;

    const handleFlip = useCallback(() => {
        setIsFlipped(v => !v);
    }, []);

    const handleRate = useCallback((familiarity: Familiarity) => {
        if (!currentCard) return;

        reviewCardMutation.mutate(
            { id: currentCard.id, familiarity },
            {
                onSuccess: () => {
                    setIsFlipped(false);
                    setReviewedCount(c => c + 1);
                    if (currentIndex < totalCards - 1) {
                        setCurrentIndex(i => i + 1);
                    }
                },
            },
        );
    }, [currentCard, currentIndex, totalCards, reviewCardMutation]);

    const handleRestart = useCallback(() => {
        setCurrentIndex(0);
        setIsFlipped(false);
        setReviewedCount(0);
    }, []);

    if (isLoading) {
        return (
            <div className="card p-card text-center py-8 text-text-secondary">加载中...</div>
        );
    }

    // All done or no cards
    if (totalCards === 0 || currentIndex >= totalCards) {
        return (
            <div className="card p-card text-center py-8">
                <Inbox size={32} className="mx-auto text-text-tertiary mb-3" />
                <p className="text-text-secondary">
                    {reviewedCount > 0 ? (
                        <>🎉 今日复习完成！已复习 {reviewedCount} 张卡片</>
                    ) : (
                        <>暂无待复习的卡片</>
                    )}
                </p>
                {reviewedCount > 0 && (
                    <button
                        onClick={handleRestart}
                        className="mt-3 text-sm text-accent hover:underline flex items-center gap-1 mx-auto"
                    >
                        <RotateCcw size={14} /> 再来一轮
                    </button>
                )}
            </div>
        );
    }

    const diffConfig = DIFFICULTY_CONFIG[currentCard.difficulty] ?? DIFFICULTY_CONFIG.medium;

    return (
        <div className="card p-card space-y-4">
            {/* Progress */}
            <div className="flex items-center justify-between text-sm text-text-secondary">
                <span>🃏 闪卡复习</span>
                <span>{currentIndex + 1} / {totalCards}</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-bg-tertiary rounded-full h-1.5">
                <div
                    className="bg-accent h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
                />
            </div>

            {/* Flashcard */}
            <button
                onClick={handleFlip}
                className="w-full min-h-[200px] rounded-xl border border-border bg-bg-secondary p-6 text-left cursor-pointer hover:shadow-md transition-shadow"
            >
                {!isFlipped ? (
                    // Front: English text
                    <div className="flex flex-col items-center justify-center min-h-[160px] text-center">
                        <p className="text-2xl font-bold text-text-primary mb-2">
                            {currentCard.front_text}
                        </p>
                        {currentCard.phonetic && (
                            <p className="text-sm text-text-secondary">{currentCard.phonetic}</p>
                        )}
                        <div className="flex items-center gap-2 mt-4">
                            <span className={`text-xs px-2 py-0.5 rounded-full bg-bg-tertiary ${diffConfig.color}`}>
                                {diffConfig.label}
                            </span>
                            <span className="text-xs text-text-tertiary">
                                {FAMILIARITY_LABELS[currentCard.familiarity as Familiarity]} · 复习 {currentCard.review_count} 次
                            </span>
                        </div>
                        <p className="text-xs text-text-tertiary mt-4 flex items-center gap-1">
                            点击翻转 <ArrowRight size={12} />
                        </p>
                    </div>
                ) : (
                    // Back: Chinese + details
                    <div className="space-y-3">
                        <p className="text-lg font-semibold text-text-primary">
                            {currentCard.front_text}
                            {currentCard.phonetic && (
                                <span className="text-sm font-normal text-text-secondary ml-2">
                                    {currentCard.phonetic}
                                </span>
                            )}
                        </p>
                        <div className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                            {currentCard.back_text}
                        </div>
                        {currentCard.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-2">
                                {currentCard.tags.map((tag, i) => (
                                    <span key={i} className="text-xs px-2 py-0.5 rounded bg-bg-tertiary text-text-tertiary">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </button>

            {/* Rating Buttons (visible after flip) */}
            {isFlipped && (
                <div>
                    <p className="text-xs text-text-tertiary text-center mb-2">你对这个词的熟悉程度？</p>
                    <div className="grid grid-cols-3 gap-2">
                        {REVIEW_BUTTONS.map(btn => (
                            <button
                                key={btn.familiarity}
                                onClick={() => handleRate(btn.familiarity)}
                                disabled={reviewCardMutation.isPending}
                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${btn.color} disabled:opacity-50`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
