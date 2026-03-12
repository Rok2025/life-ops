'use client';

import Link from 'next/link';
import { BookOpen, ArrowRight } from 'lucide-react';
import { getLocalDateStr } from '@/lib/utils/date';
import { useQueryCount, useRecentQueries } from '../hooks/useQueryHistory';
import { useCardReviewCount } from '../hooks/useEnglishCards';

export default function EnglishDailyWidget() {
    const today = getLocalDateStr();
    const { data: queryCount = 0 } = useQueryCount(today);
    const { data: reviewCount = 0 } = useCardReviewCount();
    const { data: recentQueries = [] } = useRecentQueries(3);

    const isEmpty = queryCount === 0 && reviewCount === 0;

    return (
        <div className="card p-card">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-text-secondary flex items-center gap-1.5">
                    <BookOpen size={14} />
                    今日英语
                </h3>
                <Link
                    href="/growth/english"
                    className="text-xs text-accent hover:text-accent/80 flex items-center gap-0.5"
                >
                    查看全部 <ArrowRight size={12} />
                </Link>
            </div>

            {isEmpty ? (
                <p className="text-sm text-text-tertiary py-2">
                    今天还没有学习英语，
                    <Link href="/growth/english" className="text-accent hover:underline">
                        开始学习
                    </Link>
                </p>
            ) : (
                <div className="space-y-3">
                    <div className="flex gap-4">
                        <div className="text-center">
                            <p className="text-lg font-bold text-text-primary">{queryCount}</p>
                            <p className="text-xs text-text-tertiary">查询</p>
                        </div>
                        {reviewCount > 0 && (
                            <div className="text-center">
                                <p className="text-lg font-bold text-accent">{reviewCount}</p>
                                <p className="text-xs text-text-tertiary">待复习</p>
                            </div>
                        )}
                    </div>

                    {recentQueries.length > 0 && (
                        <div className="border-t border-border pt-2">
                            <p className="text-xs text-text-tertiary mb-1.5">最近查询</p>
                            <div className="flex flex-wrap gap-1.5">
                                {recentQueries.map(q => (
                                    <span
                                        key={q.id}
                                        className="text-xs px-2 py-0.5 rounded-full bg-bg-tertiary text-text-secondary"
                                    >
                                        {q.input_text.length > 20 ? q.input_text.slice(0, 20) + '…' : q.input_text}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
