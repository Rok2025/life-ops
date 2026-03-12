'use client';

import { useState } from 'react';
import { ENGLISH_TABS } from '../constants';
import type { EnglishTab } from '../types';
import { ProjectList } from '@/features/growth-projects';
import EnglishQueryPanel from './EnglishQueryPanel';
import FlashcardReview from './FlashcardReview';
import CardListView from './CardListView';
import LearningStats from './LearningStats';

export default function EnglishPage() {
    const [tab, setTab] = useState<EnglishTab>('learning');

    return (
        <div>
            {/* Page Header */}
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-text-primary">🔤 英语学习</h1>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-border mb-6">
                {ENGLISH_TABS.map(({ key, label, icon }) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                            tab === key
                                ? 'border-accent text-accent'
                                : 'border-transparent text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        {icon} {label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {tab === 'projects' && <ProjectList area="english" />}
            {tab === 'learning' && <EnglishQueryPanel />}
            {tab === 'cards' && (
                <div className="space-y-6">
                    <FlashcardReview />
                    <CardListView />
                </div>
            )}
            {tab === 'stats' && <LearningStats />}
        </div>
    );
}
