'use client';

import { useMutation } from '@tanstack/react-query';
import { aiApi } from '../api/aiApi';
import type { PromptMode, InputType } from '../types';

export function useAIQuery() {
    return useMutation({
        mutationFn: ({
            inputText,
            promptMode,
            customInstruction,
            inputType,
            systemPromptOverride,
        }: {
            inputText: string;
            promptMode: PromptMode;
            customInstruction?: string;
            inputType?: InputType;
            systemPromptOverride?: string;
        }) => aiApi.query(inputText, promptMode, customInstruction, inputType, systemPromptOverride),
    });
}

export function useAISummary() {
    return useMutation({
        mutationFn: ({
            date,
            queries,
        }: {
            date: string;
            queries: Array<{ input_text: string; input_type: string; ai_response: Record<string, unknown> }>;
        }) => aiApi.generateSummary(date, queries),
    });
}
