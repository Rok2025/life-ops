export type CommandCategory = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    sort_order: number;
    is_active: boolean;
    is_default: boolean;
    created_at: string;
    updated_at: string;
};

export type CommandTemplate = {
    id: string;
    category_id: string;
    command_text: string;
    summary: string;
    tags: string[];
    sort_order: number;
    is_favorite: boolean;
    is_active: boolean;
    copy_count: number;
    last_copied_at: string | null;
    created_at: string;
    updated_at: string;
    category: CommandCategory | null;
};

export type CommandCategoryInput = {
    name: string;
    slug: string;
    description?: string | null;
    sort_order?: number;
    is_active?: boolean;
};

export type CommandCategoryUpdateInput = Partial<CommandCategoryInput>;

export type CommandTemplateInput = {
    category_id: string;
    command_text: string;
    summary: string;
    tags?: string[];
    sort_order?: number;
    is_favorite?: boolean;
    is_active?: boolean;
};

export type CommandTemplateUpdateInput = Partial<CommandTemplateInput>;

export type CommandCategoryFormValues = {
    name: string;
    slug: string;
    description: string;
    sortOrder: number;
    isActive: boolean;
    isDefault: boolean;
};

export type CommandTemplateFormValues = {
    categoryId: string;
    commandText: string;
    summary: string;
    tags: string;
    sortOrder: number;
    isFavorite: boolean;
    isActive: boolean;
};
