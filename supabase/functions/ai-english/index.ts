// AI English Query Edge Function
// Proxies AI API calls for English vocabulary and sentence analysis
// Provider-agnostic: configure via Supabase secrets (AI_PROVIDER, AI_API_KEY, AI_MODEL)

import { corsHeaders } from '../_shared/cors.ts';

interface QueryRequest {
    input_text: string;
    input_type: 'word' | 'phrase' | 'sentence';
    prompt_mode: 'concise' | 'detailed' | 'grammar';
    custom_instruction?: string;
    system_prompt_override?: string;
}

// ---------- System Prompts ----------

const SYSTEM_PROMPTS: Record<string, string> = {
    concise: `你是一个专业的英语学习助手。用户会输入英文单词或句子，你需要返回简洁的解析结果。
请严格按以下 JSON 格式返回，不要包含任何其他文字：
{
  "input": "用户输入的原文",
  "type": "word | phrase | sentence",
  "phonetic": "音标（单词必填，句子可为null）",
  "definitions": [
    { "pos": "词性缩写", "meaning": "中文释义", "english_meaning": "英文释义" }
  ],
  "examples": [
    { "en": "英文例句", "zh": "中文翻译" }
  ],
  "difficulty": "easy | medium | hard",
  "related_words": ["相关词1", "相关词2"],
  "grammar_notes": null,
  "suggested_tags": ["标签1"]
}
规则：
- 单词/短语：给出音标、1-2个核心释义、1个例句
- 句子：给出翻译、关键词解析
- difficulty 基于 CEFR: A1-A2=easy, B1-B2=medium, C1-C2=hard`,

    detailed: `你是一个专业的英语学习助手。用户会输入英文单词或句子，你需要返回详尽的解析结果。
请严格按以下 JSON 格式返回，不要包含任何其他文字：
{
  "input": "用户输入的原文",
  "type": "word | phrase | sentence",
  "phonetic": "音标",
  "definitions": [
    { "pos": "词性缩写", "meaning": "中文释义", "english_meaning": "英文释义" }
  ],
  "examples": [
    { "en": "英文例句", "zh": "中文翻译" }
  ],
  "difficulty": "easy | medium | hard",
  "related_words": ["同义词", "反义词", "形近词"],
  "word_origin": "词根词缀分析或词源说明（可为null）",
  "grammar_notes": "语法要点说明（可为null）",
  "collocations": ["常见搭配1", "常见搭配2"],
  "suggested_tags": ["标签1", "标签2"]
}
规则：
- 单词：给出所有常见词性的释义、2-3个例句、词根词缀分析、常见搭配
- 短语：给出释义、出处、2-3个例句
- 句子：给出翻译、语法结构分析、关键词逐个解析
- difficulty 基于 CEFR: A1-A2=easy, B1-B2=medium, C1-C2=hard`,

    grammar: `你是一个专业的英语语法分析专家。用户会输入英文句子或短语，你需要返回详细的语法分析。
请严格按以下 JSON 格式返回，不要包含任何其他文字：
{
  "input": "用户输入的原文",
  "type": "sentence",
  "phonetic": null,
  "definitions": [
    { "pos": "sentence", "meaning": "整句中文翻译", "english_meaning": "" }
  ],
  "examples": [
    { "en": "同类语法结构的例句", "zh": "中文翻译" }
  ],
  "difficulty": "easy | medium | hard",
  "related_words": [],
  "grammar_notes": "详细语法分析：句型结构、时态、语态、从句类型、关键语法点",
  "sentence_structure": "主语 + 谓语 + ... 结构拆分",
  "key_phrases": [
    { "phrase": "关键短语", "meaning": "含义", "function": "语法功能" }
  ],
  "suggested_tags": ["grammar", "标签2"]
}
规则：
- 分析句子的完整语法结构（主谓宾定状补）
- 标注时态、语态
- 识别从句类型（如有）
- 解析关键短语的含义和语法功能
- difficulty 基于语法复杂度`,
};

// ---------- AI Provider Abstraction ----------

interface AIMessage {
    role: 'system' | 'user';
    content: string;
}

async function callAI(messages: AIMessage[]): Promise<string> {
    const provider = Deno.env.get('AI_PROVIDER') ?? 'openai';
    const apiKey = Deno.env.get('AI_API_KEY');
    const model = Deno.env.get('AI_MODEL') ?? (provider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o-mini');

    if (!apiKey) {
        throw new Error('AI_API_KEY not configured. Set it via: supabase secrets set AI_API_KEY=your-key');
    }

    const endpoints: Record<string, string> = {
        openai: 'https://api.openai.com/v1/chat/completions',
        anthropic: 'https://api.anthropic.com/v1/messages',
        deepseek: 'https://api.deepseek.com/v1/chat/completions',
        gemini: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    };

    const endpoint = endpoints[provider];
    if (!endpoint) {
        throw new Error(`Unsupported AI provider: ${provider}. Use: openai, anthropic, deepseek, gemini`);
    }

    if (provider === 'anthropic') {
        const systemMsg = messages.find(m => m.role === 'system')?.content ?? '';
        const userMsgs = messages.filter(m => m.role === 'user');
        const resp = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model,
                max_tokens: 2048,
                system: systemMsg,
                messages: userMsgs.map(m => ({ role: m.role, content: m.content })),
            }),
        });
        if (!resp.ok) {
            const err = await resp.text();
            throw new Error(`Anthropic API error: ${resp.status} ${err}`);
        }
        const data = await resp.json();
        return data.content?.[0]?.text ?? '';
    }

    // OpenAI-compatible (OpenAI, DeepSeek)
    const body: Record<string, unknown> = {
        model,
        messages,
        temperature: 0.3,
        max_tokens: 2048,
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

    if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`${provider} API error: ${resp.status} ${err}`);
    }

    const data = await resp.json();
    return data.choices?.[0]?.message?.content ?? '';
}

// ---------- Handler ----------

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { input_text, input_type, prompt_mode, custom_instruction, system_prompt_override } =
            (await req.json()) as QueryRequest;

        if (!input_text?.trim()) {
            return new Response(
                JSON.stringify({ error: 'input_text is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            );
        }

        const systemPrompt = system_prompt_override?.trim()
            ? system_prompt_override.trim()
            : (SYSTEM_PROMPTS[prompt_mode] ?? SYSTEM_PROMPTS.concise);

        let userMessage = input_text.trim();
        if (custom_instruction?.trim()) {
            userMessage += `\n\n【额外要求】${custom_instruction.trim()}`;
        }

        const messages: AIMessage[] = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
        ];

        const rawResponse = await callAI(messages);

        // Parse JSON from response (handle possible markdown code block wrapping)
        let parsed;
        try {
            const cleaned = rawResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            parsed = JSON.parse(cleaned);
        } catch {
            parsed = { raw_text: rawResponse, parse_error: true };
        }

        const provider = Deno.env.get('AI_PROVIDER') ?? 'openai';

        return new Response(
            JSON.stringify({ data: parsed, provider }),
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
