'use client';

import { useState, useCallback } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { getLocalDateStr } from '@/lib/utils/date';
import { DIFFICULTY_CONFIG, FAMILIARITY_LABELS } from '../constants';
import { useCardStats, useCardReviewCount } from '../hooks/useEnglishCards';
import { useQueryCount, useQueryHistory } from '../hooks/useQueryHistory';
import { useDailySummary } from '../hooks/useDailySummary';
import { useAISummary } from '../hooks/useAIQuery';
import { useEnglishMutations } from '../hooks/useEnglishMutations';
import type { Difficulty, Familiarity } from '../types';

export default function LearningStats() {
    const today = getLocalDateStr();
    const { data: todayCount = 0 } = useQueryCount(today);
    const { data: reviewCount = 0 } = useCardReviewCount();
    const { data: stats } = useCardStats();
    const { data: summary } = useDailySummary(today);
    const { data: todayQueries = [] } = useQueryHistory(today);
    const aiSummary = useAISummary();
    const { upsertSummaryMutation } = useEnglishMutations();
    const [generatingSummary, setGeneratingSummary] = useState(false);

    const handleGenerateSummary = useCallback(async () => {
        if (todayQueries.length === 0) return;
        setGeneratingSummary(true);

        try {
            const result = await aiSummary.mutateAsync({
                date: today,
                queries: todayQueries.map(q => ({
                    input_text: q.input_text,
                    input_type: q.input_type,
                    ai_response: q.ai_response as Record<string, unknown>,
                })),
            });

            await upsertSummaryMutation.mutateAsync({
                date: today,
                updates: {
                    total_queries: todayQueries.length,
                    total_cards: stats?.total ?? 0,
                    new_words: todayQueries.map(q => q.input_text),
                    ai_summary: result.data.summary + (result.data.learning_tip ? `\n\n💡 ${result.data.learning_tip}` : ''),
                },
            });
        } catch {
            // Error accessible via aiSummary.error
        } finally {
            setGeneratingSummary(false);
        }
    }, [today, todayQueries, stats, aiSummary, upsertSummaryMutation]);

    return (
        <div className="space-y-4">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="今日查询" value={todayCount} icon="📝" />
                <StatCard label="待复习" value={reviewCount} icon="📮" accent={reviewCount > 0} />
                <StatCard label="卡片总数" value={stats?.total ?? 0} icon="🃏" />
                <StatCard label="已掌握" value={stats?.mastered ?? 0} icon="✅" />
            </div>

            {/* Difficulty Distribution */}
            {stats && stats.total > 0 && (
                <div className="card p-card">
                    <h3 className="text-sm font-medium text-text-secondary mb-3">难度分布</h3>
                    <div className="space-y-2">
                        {(Object.entries(stats.byDifficulty) as [Difficulty, number][]).map(([diff, count]) => {
                            const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                            const config = DIFFICULTY_CONFIG[diff];
                            return (
                                <div key={diff} className="flex items-center gap-3">
                                    <span className={`text-xs font-medium w-10 ${config.color}`}>{config.label}</span>
                                    <div className="flex-1 bg-bg-tertiary rounded-full h-2">
                                        <div
                                            className="bg-accent h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-text-tertiary w-8 text-right">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Familiarity Distribution */}
            {stats && stats.total > 0 && (
                <div className="card p-card">
                    <h3 className="text-sm font-medium text-text-secondary mb-3">掌握度分布</h3>
                    <div className="grid grid-cols-6 gap-2">
                        {([0, 1, 2, 3, 4, 5] as Familiarity[]).map(level => {
                            const count = stats.byFamiliarity[level] ?? 0;
                            const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                            return (
                                <div key={level} className="text-center">
                                    <div className="relative h-20 bg-bg-tertiary rounded-lg overflow-hidden mb-1">
                                        <div
                                            className="absolute bottom-0 left-0 right-0 bg-accent/60 transition-all duration-500"
                                            style={{ height: `${pct}%` }}
                                        />
                                        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-text-primary">
                                            {count}
                                        </span>
                                    </div>
                                    <span className="text-xs text-text-tertiary">{FAMILIARITY_LABELS[level]}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Daily Summary */}
            <div className="card p-card">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-text-secondary">今日总结</h3>
                    {todayQueries.length > 0 && (
                        <button
                            onClick={handleGenerateSummary}
                            disabled={generatingSummary}
                            className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 disabled:opacity-50"
                        >
                            {generatingSummary ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <Sparkles size={14} />
                            )}
                            {summary ? '重新生成' : '生成总结'}
                        </button>
                    )}
                </div>

                {summary?.ai_summary ? (
                    <div className="space-y-2">
                        <p className="text-sm text-text-primary whitespace-pre-wrap">{summary.ai_summary}</p>
                        {summary.new_words.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-2 border-t border-border">
                                {summary.new_words.map((w, i) => (
                                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                                        {w}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-text-tertiary">
                        {todayQueries.length === 0
                            ? '今天还没有查询记录'
                            : '点击"生成总结"让 AI 帮你提炼今日学习要点'}
                    </p>
                )}
            </div>
        </div>
    );
}

// ---------- Internal Components ----------

function StatCard({
    label,
    value,
    icon,
    accent,
}: {
    label: string;
    value: number;
    icon: string;
    accent?: boolean;
}) {
    return (
        <div className="card p-card text-center">
            <p className="text-2xl mb-1">{icon}</p>
            <p className={`text-2xl font-bold ${accent ? 'text-accent' : 'text-text-primary'}`}>
                {value}
            </p>
            <p className="text-xs text-text-tertiary mt-0.5">{label}</p>
        </div>
    );
}
