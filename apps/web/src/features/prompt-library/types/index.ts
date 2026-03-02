export type PromptTemplate = {
    id: string;
    title: string;
    description: string | null;
    content: string;
    tags: string[];
    is_favorite: boolean;
    use_count: number;
    last_used_at: string | null;
    created_at: string;
    updated_at: string;
};

export type PromptTemplateFilters = {
    search?: string;
    tag?: string;
    favoritesOnly?: boolean;
};

export type CreatePromptTemplateInput = {
    title: string;
    description?: string | null;
    content: string;
    tags?: string[];
    is_favorite?: boolean;
};

export type UpdatePromptTemplateInput = Partial<CreatePromptTemplateInput>;

export type PromptTemplateFormValues = {
    title: string;
    description: string;
    content: string;
    tags: string[];
    is_favorite: boolean;
};
