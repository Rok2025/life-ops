'use client';

import { useState, useCallback } from 'react';
import { RotateCcw, ArrowRight, Inbox } from 'lucide-react';
import { DIFFICULTY_CONFIG, FAMILIARITY_LABELS } from '../constants';
import { useCardsForReview } from '../hooks/useEnglishCards';
import { useEnglishMutations } from '../hooks/useEnglishMutations';
import type { Familiarity, EnglishCard } from '../types';
import { TONES } from '@/design-system/tokens';
import { Button, Card, SectionHeader } from '@/components/ui';
import PronunciationButton from './PronunciationButton';

const REVIEW_BUTTONS: { familiarity: Familiarity; label: string; color: string }[] = [
    { familiarity: 0, label: '完全不记得', color: `${TONES.danger.bg} ${TONES.danger.color} ${TONES.danger.hoverBg}` },
    { familiarity: 1, label: '很模糊', color: `${TONES.warning.bg} ${TONES.warning.color} ${TONES.warning.hoverBg}` },
    { familiarity: 2, label: '有点印象', color: `${TONES.yellow.bg} ${TONES.yellow.color} ${TONES.yellow.hoverBg}` },
    { familiarity: 3, label: '基本记得', color: `${TONES.blue.bg} ${TONES.blue.color} ${TONES.blue.hoverBg}` },
    { familiarity: 4, label: '很熟悉', color: `${TONES.success.bg} ${TONES.success.color} ${TONES.success.hoverBg}` },
    { familiarity: 5, label: '完全掌握', color: `${TONES.accent.bg} ${TONES.accent.color} ${TONES.accent.hoverBg}` },
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

    const handleCardKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleFlip();
        }
    }, [handleFlip]);

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
            <Card className="p-card text-center py-8 text-text-secondary">加载中...</Card>
        );
    }

    // All done or no cards
    if (totalCards === 0 || currentIndex >= totalCards) {
        return (
            <Card className="p-card text-center py-8">
                <Inbox size={32} className="mx-auto text-text-tertiary mb-3" />
                <p className="text-body-sm text-text-secondary">
                    {reviewedCount > 0 ? (
                        <>🎉 今日复习完成！已复习 {reviewedCount} 张卡片</>
                    ) : (
                        <>暂无待复习的卡片</>
                    )}
                </p>
                {reviewedCount > 0 && (
                    <Button
                        onClick={handleRestart}
                        variant="tinted"
                        size="sm"
                        className="mx-auto mt-3 gap-1"
                    >
                        <RotateCcw size={14} /> 再来一轮
                    </Button>
                )}
            </Card>
        );
    }

    const diffConfig = DIFFICULTY_CONFIG[currentCard.difficulty] ?? DIFFICULTY_CONFIG.medium;

    return (
        <Card className="p-card space-y-4">
            {/* Progress */}
            <SectionHeader
                title="🃏 闪卡复习"
                description={`${currentIndex + 1} / ${totalCards}`}
            />

            {/* Progress Bar */}
            <div className="w-full bg-bg-tertiary rounded-full h-1.5">
                <div
                    className="bg-accent h-1.5 rounded-full transition-all duration-normal ease-standard"
                    style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
                />
            </div>

            {/* Flashcard */}
            <div
                role="button"
                tabIndex={0}
                onClick={handleFlip}
                onKeyDown={handleCardKeyDown}
                className="w-full min-h-[200px] cursor-pointer rounded-card border border-glass-border bg-panel-bg p-6 text-left shadow-sm transition-shadow duration-normal ease-standard hover:shadow-md"
            >
                {!isFlipped ? (
                    // Front: English text
                    <div className="flex flex-col items-center justify-center min-h-[160px] text-center">
                        <div className="mb-2 flex max-w-full items-center justify-center gap-2">
                            <p className="min-w-0 break-words text-h2 font-bold text-text-primary">
                                {currentCard.front_text}
                            </p>
                            <PronunciationButton text={currentCard.front_text} stopPropagation />
                        </div>
                        {currentCard.phonetic && (
                            <p className="text-body-sm text-text-secondary">{currentCard.phonetic}</p>
                        )}
                        <div className="flex items-center gap-2 mt-4">
                            <span className={`text-caption px-2 py-0.5 rounded-full bg-bg-tertiary ${diffConfig.color}`}>
                                {diffConfig.label}
                            </span>
                            <span className="text-caption text-text-tertiary">
                                {FAMILIARITY_LABELS[currentCard.familiarity as Familiarity]} · 复习 {currentCard.review_count} 次
                            </span>
                        </div>
                        <p className="text-caption text-text-tertiary mt-4 flex items-center gap-1">
                            点击翻转 <ArrowRight size={12} />
                        </p>
                    </div>
                ) : (
                    // Back: Chinese + details
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="min-w-0 break-words text-h3 font-semibold text-text-primary">
                                {currentCard.front_text}
                            </p>
                            <PronunciationButton
                                text={currentCard.front_text}
                                size={13}
                                className="h-6 w-6"
                                stopPropagation
                            />
                            {currentCard.phonetic && (
                                <span className="text-body-sm font-normal text-text-secondary ml-2">
                                    {currentCard.phonetic}
                                </span>
                            )}
                        </div>
                        <div className="text-body-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                            {currentCard.back_text}
                        </div>
                        {currentCard.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-2">
                                {currentCard.tags.map((tag, i) => (
                                    <span key={i} className="text-caption px-2 py-0.5 rounded-control bg-bg-tertiary text-text-tertiary">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Rating Buttons (visible after flip) */}
            {isFlipped && (
                <div>
                    <p className="text-caption text-text-tertiary text-center mb-2">你对这个词的熟悉程度？</p>
                    <div className="grid grid-cols-3 gap-2">
                        {REVIEW_BUTTONS.map(btn => (
                            <button
                                key={btn.familiarity}
                                onClick={() => handleRate(btn.familiarity)}
                                disabled={reviewCardMutation.isPending}
                                className={`px-3 py-2 rounded-control text-caption font-medium transition-colors duration-normal ease-standard ${btn.color} disabled:opacity-50`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
}
