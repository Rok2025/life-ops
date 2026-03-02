'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { promptTemplatesApi } from '../api/promptTemplatesApi';
import type {
    CreatePromptTemplateInput,
    PromptTemplate,
    UpdatePromptTemplateInput,
} from '../types';

export function usePromptTemplateMutations() {
    const queryClient = useQueryClient();

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['prompt-templates'] });

    const createMutation = useMutation({
        mutationFn: (input: CreatePromptTemplateInput) => promptTemplatesApi.create(input),
        onSuccess: invalidate,
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, input }: { id: string; input: UpdatePromptTemplateInput }) =>
            promptTemplatesApi.update(id, input),
        onSuccess: invalidate,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => promptTemplatesApi.delete(id),
        onSuccess: invalidate,
    });

    const toggleFavoriteMutation = useMutation({
        mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
            promptTemplatesApi.toggleFavorite(id, isFavorite),
        onSuccess: invalidate,
    });

    const recordUseMutation = useMutation({
        mutationFn: ({ id, currentCount }: { id: string; currentCount: number }) =>
            promptTemplatesApi.recordUse(id, currentCount),
        onSuccess: invalidate,
    });

    const duplicateMutation = useMutation({
        mutationFn: (template: PromptTemplate) => promptTemplatesApi.duplicate(template),
        onSuccess: invalidate,
    });

    return {
        createMutation,
        updateMutation,
        deleteMutation,
        toggleFavoriteMutation,
        recordUseMutation,
        duplicateMutation,
    };
}
