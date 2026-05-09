'use client';

import { TodoTimelinePage as TodoTimelinePageContent } from '@/features/quick-notes';

export default function TodoAllPage() {
    return (
        <div className="min-h-full overflow-y-auto">
            <TodoTimelinePageContent />
        </div>
    );
}