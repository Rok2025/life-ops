// AI English Daily Summary Edge Function
// Generates a learning summary from the day's queries

import { corsHeaders } from '../_shared/cors.ts';

interface SummaryRequest {
    date: string;
    queries: Array<{
        input_text: string;
        input_type: string;
        ai_response: Record<string, unknown>;
    }>;
}

const SYSTEM_PROMPT = `你是一个英语学习总结助手。根据用户今天学习的所有单词和句子，生成一份简洁的每日学习总结。
请严格按以下 JSON 格式返回，不要包含任何其他文字：
{
  "summary": "今日学习总结（2-3句话，概括学习内容和主题）",
  "key_words": ["今日重点词汇1", "重点词汇2", "重点词汇3"],
  "difficulty_distribution": { "easy": 0, "medium": 0, "hard": 0 },
  "learning_tip": "基于今日学习内容给出一个学习建议"
}`;

async function callAI(systemPrompt: string, userMessage: string): Promise<string> {
    const provider = Deno.env.get('AI_PROVIDER') ?? 'openai';
    const apiKey = Deno.env.get('AI_API_KEY');
    const model = Deno.env.get('AI_MODEL') ?? (provider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o-mini');

    if (!apiKey) {
        throw new Error('AI_API_KEY not configured');
    }

    const endpoints: Record<string, string> = {
        openai: 'https://api.openai.com/v1/chat/completions',
        anthropic: 'https://api.anthropic.com/v1/messages',
        deepseek: 'https://api.deepseek.com/v1/chat/completions',
        gemini: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    };

    const endpoint = endpoints[provider];
    if (!endpoint) throw new Error(`Unsupported provider: ${provider}. Use: openai, anthropic, deepseek, gemini`);

    if (provider === 'anthropic') {
        const resp = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model,
                max_tokens: 1024,
                system: systemPrompt,
                messages: [{ role: 'user', content: userMessage }],
            }),
        });
        if (!resp.ok) throw new Error(`Anthropic error: ${resp.status}`);
        const data = await resp.json();
        return data.content?.[0]?.text ?? '';
    }

    const body: Record<string, unknown> = {
        model,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 1024,
    };
    if (provider !== 'gemini') {
        body.response_format = { type: 'json_object' };
    }

    const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
    });
    if (!resp.ok) throw new Error(`${provider} error: ${resp.status}`);
    const data = await resp.json();
    return data.choices?.[0]?.message?.content ?? '';
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { date, queries } = (await req.json()) as SummaryRequest;

        if (!queries?.length) {
            return new Response(
                JSON.stringify({ error: 'No queries to summarize' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            );
        }

        const wordList = queries.map((q, i) => {
            const resp = q.ai_response as Record<string, unknown>;
            const meaning = Array.isArray(resp.definitions)
                ? (resp.definitions[0] as Record<string, string>)?.meaning ?? ''
                : '';
            return `${i + 1}. ${q.input_text} (${q.input_type})${meaning ? ` — ${meaning}` : ''}`;
        }).join('\n');

        const userMessage = `日期: ${date}\n今日学习内容（共${queries.length}条）:\n${wordList}`;

        const rawResponse = await callAI(SYSTEM_PROMPT, userMessage);

        let parsed;
        try {
            const cleaned = rawResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            parsed = JSON.parse(cleaned);
        } catch {
            parsed = { summary: rawResponse, key_words: [], difficulty_distribution: { easy: 0, medium: 0, hard: 0 } };
        }

        return new Response(
            JSON.stringify({ data: parsed }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return new Response(
            JSON.stringify({ error: message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
    }
});
