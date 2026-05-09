import { TimelinePage as TimelinePageComponent } from '@/features/timeline';
import { getTimelineServerApi } from '@/features/timeline/api/server';
import {
    buildTimelineFilters,
    buildTimelineQueryString,
    parseTimelineRouteState,
} from '@/features/timeline/lib/timelineRouteState';
import type { TimelineEntry } from '@/features/timeline';

type TimelinePageProps = {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TimelinePage({ searchParams }: TimelinePageProps) {
    const routeState = parseTimelineRouteState(await searchParams);
    let initialEntries: TimelineEntry[] | undefined;

    try {
        const timelineApi = await getTimelineServerApi();
        initialEntries = await timelineApi.getTimeline(buildTimelineFilters(routeState));
    } catch {
        initialEntries = undefined;
    }

    return (
        <TimelinePageComponent
            key={buildTimelineQueryString(routeState) || 'default'}
            initialState={routeState}
            initialEntries={initialEntries}
        />
    );
}
