'use client';

import { useCallback } from 'react';
import { BookmarkPlus, Check } from 'lucide-react';
import { DIFFICULTY_CONFIG } from '../constants';
import { useEnglishMutations } from '../hooks/useEnglishMutations';
import type { AIQueryResponse } from '../types';
import { Card } from '@/components/ui';

interface QueryResultCardProps {
    response: AIQueryResponse;
    queryId: string | null;
}

export default function QueryResultCard({ response, queryId }: QueryResultCardProps) {
    const { saveQueryToCardMutation } = useEnglishMutations();
    const isSaved = saveQueryToCardMutation.isSuccess;
    const canSave = Boolean(queryId);

    const handleSaveToCard = useCallback(() => {
        if (isSaved || !queryId) return;

        // Build the back text from the response
        const parts: string[] = [];

        if (response.definitions?.length) {
            parts.push(response.definitions.map(d =>
                `**${d.pos}** ${d.meaning}${d.english_meaning ? ` — _${d.english_meaning}_` : ''}`
            ).join('\n'));
        }

        if (response.examples?.length) {
            parts.push('---');
            parts.push(response.examples.map(e =>
                `> ${e.en}\n> _${e.zh}_`
            ).join('\n\n'));
        }

        if (response.grammar_notes) {
            parts.push('---');
            parts.push(`📝 ${response.grammar_notes}`);
        }

        if (response.related_words?.length) {
            parts.push(`🔗 ${response.related_words.join(', ')}`);
        }

        saveQueryToCardMutation.mutate({
            queryId,
            card: {
                query_id: queryId,
                front_text: response.input,
                back_text: parts.join('\n\n'),
                phonetic: response.phonetic,
                difficulty: response.difficulty ?? 'medium',
                tags: response.suggested_tags ?? [],
                source: undefined,
            },
        });
    }, [response, queryId, isSaved, saveQueryToCardMutation]);

    // Handle parse error fallback
    if (response.parse_error && response.raw_text) {
        return (
            <Card className="p-card">
                <p className="text-body-sm text-warning mb-2">⚠️ AI 返回格式异常，原始内容：</p>
                <pre className="text-body-sm text-text-secondary whitespace-pre-wrap">{response.raw_text}</pre>
            </Card>
        );
    }

    const diffConfig = DIFFICULTY_CONFIG[response.difficulty] ?? DIFFICULTY_CONFIG.medium;

    return (
        <Card className="p-card space-y-4">
            {/* Header: word + phonetic + difficulty */}
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-h2 font-bold text-text-primary">{response.input}</h3>
                    {response.phonetic && (
                        <p className="text-body-sm text-text-secondary mt-0.5">{response.phonetic}</p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-caption font-medium px-2 py-0.5 rounded-full bg-bg-tertiary ${diffConfig.color}`}>
                        {diffConfig.label}
                    </span>
                    <button
                        onClick={handleSaveToCard}
                        disabled={!canSave || isSaved || saveQueryToCardMutation.isPending}
                        className={`flex items-center gap-1 text-caption px-3 py-1.5 rounded-control transition-colors ${
                            !canSave
                                ? 'bg-warning/10 text-warning cursor-not-allowed'
                                : isSaved
                                ? 'bg-success/10 text-success cursor-default'
                                : 'bg-accent/10 text-accent hover:bg-accent/20'
                        }`}
                    >
                        {isSaved ? <Check size={14} /> : <BookmarkPlus size={14} />}
                        {!canSave ? '未保存' : isSaved ? '已存卡' : '存为闪卡'}
                    </button>
                </div>
            </div>

            {/* Definitions */}
            {response.definitions?.length > 0 && (
                <div>
                    <h4 className="text-caption font-medium text-text-tertiary uppercase tracking-wide mb-2">释义</h4>
                    <div className="space-y-1.5">
                        {response.definitions.map((def, i) => (
                            <div key={i} className="flex gap-2">
                                <span className="text-caption font-medium text-accent bg-accent/10 px-1.5 py-0.5 rounded shrink-0">
                                    {def.pos}
                                </span>
                                <div>
                                    <span className="text-body-sm text-text-primary">{def.meaning}</span>
                                    {def.english_meaning && (
                                        <span className="text-body-sm text-text-tertiary ml-2 italic">
                                            {def.english_meaning}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Examples */}
            {response.examples?.length > 0 && (
                <div>
                    <h4 className="text-caption font-medium text-text-tertiary uppercase tracking-wide mb-2">例句</h4>
                    <div className="space-y-2">
                        {response.examples.map((ex, i) => (
                            <div key={i} className="pl-3 border-l-2 border-accent/30">
                                <p className="text-body-sm text-text-primary">{ex.en}</p>
                                <p className="text-body-sm text-text-secondary">{ex.zh}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Grammar Notes */}
            {response.grammar_notes && (
                <div>
                    <h4 className="text-caption font-medium text-text-tertiary uppercase tracking-wide mb-2">语法笔记</h4>
                    <p className="text-body-sm text-text-secondary bg-bg-tertiary rounded-control p-3">
                        {response.grammar_notes}
                    </p>
                </div>
            )}

            {/* Sentence Structure */}
            {response.sentence_structure && (
                <div>
                    <h4 className="text-caption font-medium text-text-tertiary uppercase tracking-wide mb-2">句型结构</h4>
                    <p className="text-body-sm text-text-secondary font-mono bg-bg-tertiary rounded-control p-3">
                        {response.sentence_structure}
                    </p>
                </div>
            )}

            {/* Key Phrases (for grammar mode) */}
            {response.key_phrases?.length ? (
                <div>
                    <h4 className="text-caption font-medium text-text-tertiary uppercase tracking-wide mb-2">关键短语</h4>
                    <div className="space-y-1.5">
                        {response.key_phrases.map((kp, i) => (
                            <div key={i} className="flex gap-2 text-body-sm">
                                <span className="font-medium text-text-primary shrink-0">{kp.phrase}</span>
                                <span className="text-text-secondary">— {kp.meaning}</span>
                                <span className="text-text-tertiary italic">({kp.function})</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            {/* Word Origin */}
            {response.word_origin && (
                <div>
                    <h4 className="text-caption font-medium text-text-tertiary uppercase tracking-wide mb-2">词源分析</h4>
                    <p className="text-body-sm text-text-secondary">{response.word_origin}</p>
                </div>
            )}

            {/* Collocations */}
            {response.collocations?.length ? (
                <div>
                    <h4 className="text-caption font-medium text-text-tertiary uppercase tracking-wide mb-2">常见搭配</h4>
                    <div className="flex flex-wrap gap-1.5">
                        {response.collocations.map((c, i) => (
                            <span key={i} className="text-caption px-2 py-1 rounded-full bg-bg-tertiary text-text-secondary">
                                {c}
                            </span>
                        ))}
                    </div>
                </div>
            ) : null}

            {/* Related Words */}
            {response.related_words?.length > 0 && (
                <div>
                    <h4 className="text-caption font-medium text-text-tertiary uppercase tracking-wide mb-2">相关词</h4>
                    <div className="flex flex-wrap gap-1.5">
                        {response.related_words.map((w, i) => (
                            <span key={i} className="text-caption px-2 py-1 rounded-full bg-accent/10 text-accent">
                                {w}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Tags */}
            {response.suggested_tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2 border-t border-border">
                    {response.suggested_tags.map((tag, i) => (
                        <span key={i} className="text-caption px-2 py-0.5 rounded bg-bg-tertiary text-text-tertiary">
                            #{tag}
                        </span>
                    ))}
                </div>
            )}
        </Card>
    );
}
