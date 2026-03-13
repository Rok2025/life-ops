'use client';

import Link from 'next/link';
import { ArrowUpRight, BookOpen, RotateCcw, Search } from 'lucide-react';
import { Card } from '@/components/ui';
import { getLocalDateStr } from '@/lib/utils/date';
import { useQueryCount, useRecentQueries } from '../hooks/useQueryHistory';
import { useCardReviewCount } from '../hooks/useEnglishCards';

export default function EnglishDailyWidget() {
    const today = getLocalDateStr();
    const { data: queryCount = 0 } = useQueryCount(today);
    const { data: reviewCount = 0 } = useCardReviewCount();
    const { data: recentQueries = [] } = useRecentQueries(3);

    const isEmpty = queryCount === 0 && reviewCount === 0;
    const totalActivity = queryCount + reviewCount;

    return (
        <Card className="h-full overflow-hidden p-card">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-accent/7 blur-3xl dark:bg-accent/6" />
            <div className="absolute left-10 top-6 h-14 w-24 rounded-full bg-white/7 blur-3xl dark:bg-white/4" />

            <div className="relative space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="glass-icon-badge h-9 w-9 rounded-card">
                            <BookOpen size={16} className="text-accent" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-h3 font-semibold text-text-primary">今日英语</h3>
                            <p className="text-caption text-text-secondary">
                                {isEmpty ? '从一个单词开始' : `今日 ${totalActivity} 次英语动作`}
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/growth/english"
                        className="glass-mini-chip shrink-0 text-caption text-accent transition-colors duration-normal ease-standard hover:text-accent-hover"
                    >
                        进入英语
                        <ArrowUpRight size={12} />
                    </Link>
                </div>

                {isEmpty ? (
                    <div className="glass-list-row flex items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                            <div className="text-body-sm font-medium text-text-primary">还没有开始</div>
                            <div className="text-caption text-text-secondary">查一个词，或者开一组复习卡片。</div>
                        </div>
                        <Link
                            href="/growth/english"
                            className="rounded-control border border-glass-border bg-panel-bg px-3 py-1.5 text-body-sm text-accent backdrop-blur-xl transition-colors duration-normal ease-standard hover:bg-card-bg"
                        >
                            开始学习
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-2 sm:grid-cols-2">
                            <div className="glass-list-row px-4 py-3">
                                <div className="flex items-center justify-between text-caption text-text-tertiary">
                                    <span>查询</span>
                                    <Search size={14} />
                                </div>
                                <div className="mt-2 flex items-end justify-between gap-2">
                                    <span className="text-h2 font-semibold text-text-primary">{queryCount}</span>
                                    <span className="text-caption text-text-secondary">
                                        {queryCount > 0 ? '保持输入' : '等待开始'}
                                    </span>
                                </div>
                            </div>

                            <div className="glass-list-row px-4 py-3">
                                <div className="flex items-center justify-between text-caption text-text-tertiary">
                                    <span>待复习</span>
                                    <RotateCcw size={14} />
                                </div>
                                <div className="mt-2 flex items-end justify-between gap-2">
                                    <span className="text-h2 font-semibold text-text-primary">{reviewCount}</span>
                                    <span className={reviewCount > 0 ? 'text-caption text-accent' : 'text-caption text-text-secondary'}>
                                        {reviewCount > 0 ? '该回顾了' : '已清空'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {recentQueries.length > 0 ? (
                            <div className="rounded-[1.125rem] border border-glass-border bg-card-bg/72 px-4 py-3 backdrop-blur-xl">
                                <div className="mb-2 flex items-center justify-between gap-2">
                                    <span className="text-caption text-text-tertiary">最近查询</span>
                                    <span className="glass-mini-chip text-caption">{recentQueries.length} 条</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {recentQueries.map((q) => (
                                        <span
                                            key={q.id}
                                            className="glass-mini-chip text-caption text-text-primary"
                                        >
                                            {q.input_text.length > 18 ? `${q.input_text.slice(0, 18)}…` : q.input_text}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-[1.125rem] border border-dashed border-glass-border px-4 py-3 text-caption text-text-secondary">
                                今天的查询还没有留下最近记录。
                            </div>
                        )}
                    </>
                )}
            </div>
        </Card>
    );
}
