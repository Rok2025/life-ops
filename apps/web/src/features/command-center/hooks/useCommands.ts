'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { commandsApi } from '../api/commandsApi';
import type {
    CommandCategoryInput,
    CommandCategoryUpdateInput,
    CommandTemplateInput,
    CommandTemplateUpdateInput,
} from '../types';

export function useCommandCategories(activeOnly = false) {
    return useQuery({
        queryKey: ['command-categories', activeOnly],
        queryFn: () => commandsApi.getCategories(activeOnly),
    });
}

export function useCommandTemplates(activeOnly = false) {
    return useQuery({
        queryKey: ['command-templates', activeOnly],
        queryFn: () => commandsApi.getTemplates(activeOnly),
    });
}

export function useCommandMutations() {
    const queryClient = useQueryClient();

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['command-categories'] });
        queryClient.invalidateQueries({ queryKey: ['command-templates'] });
    };

    const createCategoryMutation = useMutation({
        mutationFn: (input: CommandCategoryInput) => commandsApi.createCategory(input),
        onSuccess: invalidate,
    });

    const updateCategoryMutation = useMutation({
        mutationFn: ({ id, input }: { id: string; input: CommandCategoryUpdateInput }) =>
            commandsApi.updateCategory(id, input),
        onSuccess: invalidate,
    });

    const deleteCategoryMutation = useMutation({
        mutationFn: (id: string) => commandsApi.deleteCategory(id),
        onSuccess: invalidate,
    });

    const setDefaultCategoryMutation = useMutation({
        mutationFn: (id: string) => commandsApi.setDefaultCategory(id),
        onSuccess: invalidate,
    });

    const createTemplateMutation = useMutation({
        mutationFn: (input: CommandTemplateInput) => commandsApi.createTemplate(input),
        onSuccess: invalidate,
    });

    const updateTemplateMutation = useMutation({
        mutationFn: ({ id, input }: { id: string; input: CommandTemplateUpdateInput }) =>
            commandsApi.updateTemplate(id, input),
        onSuccess: invalidate,
    });

    const deleteTemplateMutation = useMutation({
        mutationFn: (id: string) => commandsApi.deleteTemplate(id),
        onSuccess: invalidate,
    });

    const toggleTemplateMutation = useMutation({
        mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
            commandsApi.setTemplateActive(id, isActive),
        onSuccess: invalidate,
    });

    const recordCopyMutation = useMutation({
        mutationFn: ({ id, copyCount }: { id: string; copyCount: number }) =>
            commandsApi.recordCopy(id, copyCount),
        onSuccess: invalidate,
    });

    return {
        createCategoryMutation,
        updateCategoryMutation,
        deleteCategoryMutation,
        setDefaultCategoryMutation,
        createTemplateMutation,
        updateTemplateMutation,
        deleteTemplateMutation,
        toggleTemplateMutation,
        recordCopyMutation,
    };
}
