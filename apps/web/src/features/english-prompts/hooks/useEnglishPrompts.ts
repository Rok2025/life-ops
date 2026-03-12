'use client';

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { englishPromptApi } from '../api/englishPromptApi';
import type {
    CreateEnglishPromptTemplateInput,
    EnglishPromptMode,
    EnglishPromptModeBinding,
    UpdateEnglishPromptTemplateInput,
} from '../types';

export function useEnglishPromptTemplates() {
    return useQuery({
        queryKey: ['english-prompt-templates'],
        queryFn: () => englishPromptApi.getTemplates(),
    });
}

export function useEnglishPromptBindings() {
    return useQuery({
        queryKey: ['english-prompt-bindings'],
        queryFn: () => englishPromptApi.getBindings(),
    });
}

export function useResolvedEnglishPrompt(mode: EnglishPromptMode): {
    prompt: string | undefined;
    binding: EnglishPromptModeBinding | null;
    loading: boolean;
} {
    const bindingsQuery = useEnglishPromptBindings();

    const binding = useMemo(
        () => (bindingsQuery.data ?? []).find(item => item.mode === mode) ?? null,
        [bindingsQuery.data, mode],
    );

    const prompt = binding?.template?.content;

    return {
        prompt,
        binding,
        loading: bindingsQuery.isLoading,
    };
}

export function useEnglishPromptMutations() {
    const queryClient = useQueryClient();

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['english-prompt-templates'] });
        queryClient.invalidateQueries({ queryKey: ['english-prompt-bindings'] });
    };

    const createTemplateMutation = useMutation({
        mutationFn: (input: CreateEnglishPromptTemplateInput) => englishPromptApi.createTemplate(input),
        onSuccess: invalidate,
    });

    const updateTemplateMutation = useMutation({
        mutationFn: ({ id, input }: { id: string; input: UpdateEnglishPromptTemplateInput }) =>
            englishPromptApi.updateTemplate(id, input),
        onSuccess: invalidate,
    });

    const deleteTemplateMutation = useMutation({
        mutationFn: (id: string) => englishPromptApi.deleteTemplate(id),
        onSuccess: invalidate,
    });

    const toggleTemplateMutation = useMutation({
        mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
            englishPromptApi.setTemplateActive(id, isActive),
        onSuccess: invalidate,
    });

    const setBindingMutation = useMutation({
        mutationFn: ({ mode, templateId }: { mode: EnglishPromptMode; templateId: string | null }) =>
            englishPromptApi.setBinding(mode, templateId),
        onSuccess: invalidate,
    });

    return {
        createTemplateMutation,
        updateTemplateMutation,
        deleteTemplateMutation,
        toggleTemplateMutation,
        setBindingMutation,
    };
}
