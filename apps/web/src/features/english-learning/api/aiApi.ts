import { supabase } from '@/lib/supabase';
import type { AIQueryResponse, PromptMode, InputType } from '../types';

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const aiApi = {
    /** Call AI English query Edge Function */
    query: async (
        inputText: string,
        promptMode: PromptMode,
        customInstruction?: string,
        inputType?: InputType,
        systemPromptOverride?: string,
    ): Promise<{ data: AIQueryResponse; provider: string }> => {
        if (!supabaseAnonKey) {
            throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured');
        }

        const { data, error, response } = await supabase.functions.invoke('ai-english', {
            headers: getFunctionHeaders(supabaseAnonKey),
            body: {
                input_text: inputText,
                input_type: inputType ?? detectInputType(inputText),
                prompt_mode: promptMode,
                custom_instruction: customInstruction || undefined,
                system_prompt_override: systemPromptOverride || undefined,
            },
        });

        if (error) {
            throw await toFunctionError(error, response);
        }
        if (data?.error) throw new Error(data.error);
        return data;
    },

    /** Call AI summary Edge Function */
    generateSummary: async (
        date: string,
        queries: Array<{ input_text: string; input_type: string; ai_response: Record<string, unknown> }>,
    ): Promise<{ data: { summary: string; key_words: string[]; difficulty_distribution: Record<string, number>; learning_tip?: string } }> => {
        if (!supabaseAnonKey) {
            throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured');
        }

        const { data, error, response } = await supabase.functions.invoke('ai-english-summary', {
            headers: getFunctionHeaders(supabaseAnonKey),
            body: { date, queries },
        });

        if (error) {
            throw await toFunctionError(error, response);
        }
        if (data?.error) throw new Error(data.error);
        return data;
    },
};

/** Detect input type: single word, phrase, or sentence */
function detectInputType(text: string): InputType {
    const trimmed = text.trim();
    if (/[.!?]$/.test(trimmed) || trimmed.split(/\s+/).length > 6) return 'sentence';
    if (trimmed.split(/\s+/).length > 1) return 'phrase';
    return 'word';
}

async function toFunctionError(error: unknown, response?: Response): Promise<Error> {
    if (!response) {
        return error instanceof Error ? error : new Error('Edge Function request failed');
    }

    try {
        const contentType = response.headers.get('content-type') ?? '';
        if (contentType.includes('application/json')) {
            const payload = await response.clone().json() as { error?: unknown; message?: unknown };
            if (typeof payload.error === 'string' && payload.error) {
                return new Error(payload.error);
            }
            if (typeof payload.message === 'string' && payload.message) {
                return new Error(payload.message);
            }
        } else {
            const text = await response.clone().text();
            if (text.trim()) {
                return new Error(text.trim());
            }
        }
    } catch {
        // Fall through to status-based fallback.
    }

    return new Error(`Edge Function request failed (${response.status})`);
}

function getFunctionHeaders(anonKey: string): Record<string, string> {
    return {
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
    };
}
