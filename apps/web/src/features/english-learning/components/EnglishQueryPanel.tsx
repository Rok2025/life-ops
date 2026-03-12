'use client';

import { useState, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { getLocalDateStr } from '@/lib/utils/date';
import { useResolvedEnglishPrompt } from '@/features/english-prompts';
import { PROMPT_MODES } from '../constants';
import { useAIQuery } from '../hooks/useAIQuery';
import { useEnglishMutations } from '../hooks/useEnglishMutations';
import { useQueryHistory } from '../hooks/useQueryHistory';
import type { PromptMode, AIQueryResponse } from '../types';
import QueryResultCard from './QueryResultCard';
import PromptModeSelector from './PromptModeSelector';

export default function EnglishQueryPanel() {
    const today = getLocalDateStr();
    const [inputText, setInputText] = useState('');
    const [promptMode, setPromptMode] = useState<PromptMode>('concise');
    const [customInstruction, setCustomInstruction] = useState('');
    const [lastResult, setLastResult] = useState<{
        response: AIQueryResponse;
        queryId: string | null;
        resultId: string;
    } | null>(null);
    const [saveWarning, setSaveWarning] = useState<string | null>(null);

    const aiQuery = useAIQuery();
    const { createQueryMutation } = useEnglishMutations();
    const { data: todayQueries = [] } = useQueryHistory(today);
    const { prompt: selectedPrompt } = useResolvedEnglishPrompt(promptMode);

    const handleQuery = useCallback(async () => {
        const trimmed = inputText.trim();
        if (!trimmed) return;
        setSaveWarning(null);

        try {
            const result = await aiQuery.mutateAsync({
                inputText: trimmed,
                promptMode,
                customInstruction: customInstruction.trim() || undefined,
                systemPromptOverride: selectedPrompt,
            });
            const response = normalizeAIQueryResponse(result.data, trimmed);
            let queryId: string | null = null;

            try {
                const saved = await createQueryMutation.mutateAsync({
                    input_text: trimmed,
                    input_type: response.type,
                    prompt_mode: promptMode,
                    custom_instruction: customInstruction.trim() || null,
                    ai_response: response,
                    ai_provider: result.provider,
                    query_date: today,
                });
                queryId = saved.id;
            } catch (error) {
                setSaveWarning(`查询结果已生成，但保存记录失败：${getErrorMessage(error)}`);
            }

            setLastResult({ response, queryId, resultId: crypto.randomUUID() });
        } catch (error) {
            setSaveWarning(null);
            console.error('English quick query failed', error);
        }
    }, [inputText, promptMode, customInstruction, today, aiQuery, createQueryMutation, selectedPrompt]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            void handleQuery();
        }
    }, [handleQuery]);

    return (
        <div className="space-y-4">
            {/* Input Area */}
            <div className="card p-card">
                <div className="space-y-3">
                    <div className="relative">
                        <textarea
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="输入英文单词、短语或句子..."
                            rows={2}
                            className="w-full px-4 py-3 pr-12 rounded-xl border border-border bg-bg-primary text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none"
                        />
                        <button
                            onClick={handleQuery}
                            disabled={!inputText.trim() || aiQuery.isPending}
                            className="absolute right-3 top-3 p-1.5 rounded-lg bg-accent text-white hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            {aiQuery.isPending ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Search size={18} />
                            )}
                        </button>
                    </div>

                    {/* Mode Selector */}
                    <PromptModeSelector
                        mode={promptMode}
                        onModeChange={setPromptMode}
                        customInstruction={customInstruction}
                        onCustomInstructionChange={setCustomInstruction}
                    />

                    <p className="text-xs text-text-tertiary">
                        ⌘+Enter 快速查询 · 今日已查询 {todayQueries.length} 条
                    </p>
                </div>
            </div>

            {/* Error */}
            {aiQuery.isError && (
                <div className="card p-card border-danger/30 bg-danger/5">
                    <p className="text-sm text-danger">
                        查询失败: {aiQuery.error instanceof Error ? aiQuery.error.message : '未知错误'}
                    </p>
                </div>
            )}

            {saveWarning && (
                <div className="card p-card border-warning/30 bg-warning/5">
                    <p className="text-sm text-warning">{saveWarning}</p>
                </div>
            )}

            {/* Result */}
            {lastResult && (
                <QueryResultCard
                    key={lastResult.resultId}
                    response={lastResult.response}
                    queryId={lastResult.queryId}
                />
            )}

            {/* Today's Query History */}
            {todayQueries.length > 0 && (
                <div className="card p-card">
                    <h3 className="text-sm font-medium text-text-secondary mb-3">
                        今日查询记录 ({todayQueries.length})
                    </h3>
                    <div className="space-y-2">
                        {todayQueries.map(q => (
                            <button
                                key={q.id}
                                onClick={() => setLastResult({
                                    response: normalizeAIQueryResponse(q.ai_response, q.input_text),
                                    queryId: q.id,
                                    resultId: crypto.randomUUID(),
                                })}
                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-bg-tertiary transition-colors flex items-center justify-between"
                            >
                                <span className="text-sm text-text-primary font-medium">{q.input_text}</span>
                                <div className="flex items-center gap-2">
                                    {q.is_saved && (
                                        <span className="text-xs text-success">已存卡</span>
                                    )}
                                    <span className="text-xs text-text-tertiary">
                                        {PROMPT_MODES.find(m => m.key === q.prompt_mode)?.label ?? q.prompt_mode}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function normalizeAIQueryResponse(response: AIQueryResponse, fallbackInput: string): AIQueryResponse {
    return {
        input: response.input || fallbackInput,
        type: response.type ?? detectFallbackInputType(fallbackInput),
        phonetic: response.phonetic ?? null,
        definitions: Array.isArray(response.definitions) ? response.definitions : [],
        examples: Array.isArray(response.examples) ? response.examples : [],
        difficulty: response.difficulty ?? 'medium',
        related_words: Array.isArray(response.related_words) ? response.related_words : [],
        grammar_notes: response.grammar_notes ?? null,
        word_origin: response.word_origin ?? null,
        collocations: Array.isArray(response.collocations) ? response.collocations : [],
        sentence_structure: response.sentence_structure ?? null,
        key_phrases: Array.isArray(response.key_phrases) ? response.key_phrases : [],
        suggested_tags: Array.isArray(response.suggested_tags) ? response.suggested_tags : [],
        raw_text: response.raw_text,
        parse_error: response.parse_error,
    };
}

function detectFallbackInputType(text: string): AIQueryResponse['type'] {
    const trimmed = text.trim();
    if (/[.!?]$/.test(trimmed) || trimmed.split(/\s+/).length > 6) return 'sentence';
    if (trimmed.split(/\s+/).length > 1) return 'phrase';
    return 'word';
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'object' && error && 'message' in error) {
        const message = (error as { message?: unknown }).message;
        if (typeof message === 'string' && message) {
            return message;
        }
    }
    return '未知错误';
}
