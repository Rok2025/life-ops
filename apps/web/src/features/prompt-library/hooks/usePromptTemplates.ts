'use client';

import { useQuery } from '@tanstack/react-query';
import { promptTemplatesApi } from '../api/promptTemplatesApi';
import type { PromptTemplateFilters } from '../types';

export function usePromptTemplates(filters: PromptTemplateFilters) {
    return useQuery({
        queryKey: [
            'prompt-templates',
            filters.search ?? '',
            filters.tag ?? '',
            filters.favoritesOnly ?? false,
        ],
        queryFn: () => promptTemplatesApi.getAll(filters),
    });
}
