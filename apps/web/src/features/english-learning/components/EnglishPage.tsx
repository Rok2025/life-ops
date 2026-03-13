'use client';

import { useState } from 'react';
import { Languages } from 'lucide-react';
import { getLocalDateStr } from '@/lib/utils/date';
import { ENGLISH_TABS } from '../constants';
import type { EnglishTab } from '../types';
import { useCardReviewCount, useCardStats } from '../hooks/useEnglishCards';
import { useQueryCount } from '../hooks/useQueryHistory';
import { ProjectList } from '@/features/growth-projects';
import EnglishQueryPanel from './EnglishQueryPanel';
import FlashcardReview from './FlashcardReview';
import CardListView from './CardListView';
import LearningStats from './LearningStats';
import { PageHero } from '@/components/ui';

export default function EnglishPage() {
    const [tab, setTab] = useState<EnglishTab>('learning');
    const today = getLocalDateStr();
    const { data: queryCount = 0 } = useQueryCount(today);
    const { data: reviewCount = 0 } = useCardReviewCount();
    const { data: cardStats } = useCardStats();

    return (
        <div className="space-y-4 xl:space-y-5">
            <PageHero
                eyebrow="成长 / 英语"
                icon={<Languages size={18} className="text-accent" />}
                title="英语学习"
                description="把即时查询、项目推进、卡片复习和学习总结放进同一套节奏里。"
                stats={[
                    {
                        label: '今日查询',
                        value: queryCount,
                        meta: tab === 'learning' ? '即时理解' : '持续积累',
                        tone: 'accent',
                    },
                    {
                        label: '待复习',
                        value: reviewCount,
                        meta: reviewCount > 0 ? '建议回顾' : '已清空',
                        tone: 'warning',
                    },
                    {
                        label: '卡片总数',
                        value: cardStats?.total ?? 0,
                        meta: `${cardStats?.mastered ?? 0} 已掌握`,
                        tone: 'success',
                    },
                ]}
            >
                <div className="glass-filter-bar flex items-center">
                    {ENGLISH_TABS.map(({ key, label, icon }) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={`glass-filter-chip text-body-sm ${tab === key ? 'glass-filter-chip-active font-medium text-text-primary' : ''}`}
                        >
                            {icon} {label}
                        </button>
                    ))}
                </div>
            </PageHero>

            {/* Tab Content */}
            {tab === 'projects' && <ProjectList area="english" />}
            {tab === 'learning' && <EnglishQueryPanel />}
            {tab === 'cards' && (
                <div className="space-y-section">
                    <FlashcardReview />
                    <CardListView />
                </div>
            )}
            {tab === 'stats' && <LearningStats />}
        </div>
    );
}
