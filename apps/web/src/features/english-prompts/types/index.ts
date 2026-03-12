export type EnglishPromptMode = 'concise' | 'detailed' | 'grammar';

export type EnglishPromptTemplate = {
    id: string;
    title: string;
    description: string | null;
    content: string;
    supported_modes: EnglishPromptMode[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

export type EnglishPromptModeBinding = {
    mode: EnglishPromptMode;
    template_id: string | null;
    updated_at: string;
    template?: EnglishPromptTemplate | null;
};

export type CreateEnglishPromptTemplateInput = {
    title: string;
    description?: string | null;
    content: string;
    supported_modes: EnglishPromptMode[];
    is_active?: boolean;
};

export type UpdateEnglishPromptTemplateInput = Partial<CreateEnglishPromptTemplateInput>;

export type EnglishPromptTemplateFormValues = {
    title: string;
    description: string;
    content: string;
    supportedModes: EnglishPromptMode[];
    isActive: boolean;
};

export const ENGLISH_PROMPT_MODE_META: Array<{
    key: EnglishPromptMode;
    label: string;
    description: string;
}> = [
    { key: 'concise', label: '简洁', description: '音标 + 核心释义 + 1 个例句' },
    { key: 'detailed', label: '详细', description: '完整解析 + 词根搭配 + 多例句' },
    { key: 'grammar', label: '语法', description: '语法结构 + 时态 + 句型分析' },
];
