// ---------- Enums / Literals ----------

export type InputType = 'word' | 'phrase' | 'sentence';
export type PromptMode = 'concise' | 'detailed' | 'grammar';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Familiarity = 0 | 1 | 2 | 3 | 4 | 5;
export type EnglishTab = 'projects' | 'learning' | 'cards' | 'stats';

// ---------- AI Response ----------

export type AIDefinition = {
    pos: string;
    meaning: string;
    english_meaning: string;
};

export type AIExample = {
    en: string;
    zh: string;
};

export type AIKeyPhrase = {
    phrase: string;
    meaning: string;
    function: string;
};

export type AIQueryResponse = {
    input: string;
    type: InputType;
    phonetic: string | null;
    definitions: AIDefinition[];
    examples: AIExample[];
    difficulty: Difficulty;
    related_words: string[];
    grammar_notes: string | null;
    word_origin?: string | null;
    collocations?: string[];
    sentence_structure?: string | null;
    key_phrases?: AIKeyPhrase[];
    suggested_tags: string[];
    // Fallback for parse errors
    raw_text?: string;
    parse_error?: boolean;
};

// ---------- Database Models ----------

export type EnglishQuery = {
    id: string;
    input_text: string;
    input_type: InputType;
    prompt_mode: PromptMode;
    custom_instruction: string | null;
    ai_response: AIQueryResponse;
    ai_provider: string | null;
    is_saved: boolean;
    query_date: string;
    created_at: string;
};

export type EnglishCard = {
    id: string;
    query_id: string | null;
    front_text: string;
    back_text: string;
    phonetic: string | null;
    difficulty: Difficulty;
    tags: string[];
    source: string | null;
    review_count: number;
    last_reviewed_at: string | null;
    next_review_at: string | null;
    familiarity: Familiarity;
    created_at: string;
    updated_at: string;
};

export type DailySummary = {
    id: string;
    summary_date: string;
    total_queries: number;
    total_cards: number;
    new_words: string[];
    ai_summary: string | null;
    created_at: string;
    updated_at: string;
};

// ---------- Input Types ----------

export type CreateQueryInput = {
    input_text: string;
    input_type: InputType;
    prompt_mode: PromptMode;
    custom_instruction?: string | null;
    ai_response: AIQueryResponse;
    ai_provider?: string | null;
    query_date: string;
};

export type CreateCardInput = {
    query_id?: string | null;
    front_text: string;
    back_text: string;
    phonetic?: string | null;
    difficulty: Difficulty;
    tags?: string[];
    source?: string | null;
};

export type UpdateCardInput = Partial<
    Pick<EnglishCard, 'front_text' | 'back_text' | 'phonetic' | 'difficulty' | 'tags' | 'source'>
>;

export type CardFilters = {
    search?: string;
    difficulty?: Difficulty;
    familiarity?: Familiarity;
    tag?: string;
};

// ---------- AI Summary Response ----------

export type AISummaryResponse = {
    summary: string;
    key_words: string[];
    difficulty_distribution: Record<Difficulty, number>;
    learning_tip?: string;
};

// ---------- Dashboard Stats ----------

export type EnglishDailyStats = {
    todayQueries: number;
    cardsForReview: number;
    recentQueries: EnglishQuery[];
};
