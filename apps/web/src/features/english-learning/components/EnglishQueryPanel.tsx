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
import { Button, Card, Input, SectionHeader } from '@/components/ui';

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
            <Card className="p-card">
                <div className="space-y-3">
                    <SectionHeader
                        title="即时查询"
                        description="输入单词、短语或句子，立刻得到解析，并能顺手保存到学习记录里。"
                    />
                    <div className="relative">
                        <Input
                            multiline
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="输入英文单词、短语或句子..."
                            rows={2}
                            className="resize-none pr-14"
                        />
                        <Button
                            onClick={handleQuery}
                            disabled={!inputText.trim() || aiQuery.isPending}
                            variant="tinted"
                            size="sm"
                            className="absolute right-3 top-3 h-9 w-9 p-0"
                        >
                            {aiQuery.isPending ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Search size={18} />
                            )}
                        </Button>
                    </div>

                    {/* Mode Selector */}
                    <PromptModeSelector
                        mode={promptMode}
                        onModeChange={setPromptMode}
                        customInstruction={customInstruction}
                        onCustomInstructionChange={setCustomInstruction}
                    />

                    <p className="text-caption text-text-tertiary">
                        ⌘+Enter 快速查询 · 今日已查询 {todayQueries.length} 条
                    </p>
                </div>
            </Card>

            {/* Error */}
            {aiQuery.isError && (
                <Card className="border border-danger/25 bg-danger/8 p-card">
                    <p className="text-body-sm text-danger">
                        查询失败: {aiQuery.error instanceof Error ? aiQuery.error.message : '未知错误'}
                    </p>
                </Card>
            )}

            {saveWarning && (
                <Card className="border border-warning/25 bg-warning/8 p-card">
                    <p className="text-body-sm text-warning">{saveWarning}</p>
                </Card>
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
                <Card className="p-card">
                    <SectionHeader
                        title={`今日查询记录 (${todayQueries.length})`}
                        description="点选任意一条，回到刚才的解析结果继续整理。"
                        className="mb-3"
                    />
                    <div className="space-y-2">
                        {todayQueries.map(q => (
                            <button
                                key={q.id}
                                onClick={() => setLastResult({
                                    response: normalizeAIQueryResponse(q.ai_response, q.input_text),
                                    queryId: q.id,
                                    resultId: crypto.randomUUID(),
                                })}
                                className="glass-list-row flex w-full items-center justify-between px-3 py-2 text-left"
                            >
                                <span className="text-body-sm text-text-primary font-medium">{q.input_text}</span>
                                <div className="flex items-center gap-2">
                                    {q.is_saved && (
                                        <span className="text-caption text-success">已存卡</span>
                                    )}
                                    <span className="text-caption text-text-tertiary">
                                        {PROMPT_MODES.find(m => m.key === q.prompt_mode)?.label ?? q.prompt_mode}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </Card>
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
