import { SearchPage as SearchPageComponent } from '@/features/search';
import { getSearchServerApi } from '@/features/search/api/server';
import { buildSearchFilters, buildSearchQueryString, parseSearchRouteState } from '@/features/search/lib/searchRouteState';
import type { SearchResult } from '@/features/search';

type SearchPageProps = {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const routeState = parseSearchRouteState(await searchParams);
    let initialResults: SearchResult[] | undefined;

    if (routeState.keyword) {
        try {
            const searchApi = await getSearchServerApi();
            initialResults = await searchApi.search(routeState.keyword, buildSearchFilters(routeState));
        } catch {
            initialResults = undefined;
        }
    }

    return (
        <SearchPageComponent
            key={buildSearchQueryString(routeState) || 'default'}
            initialState={routeState}
            initialResults={initialResults}
        />
    );
}
