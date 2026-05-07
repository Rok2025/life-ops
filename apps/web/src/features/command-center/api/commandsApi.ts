import { supabase } from '@/lib/supabase';
import type {
    CommandCategory,
    CommandCategoryInput,
    CommandCategoryUpdateInput,
    CommandTemplate,
    CommandTemplateInput,
    CommandTemplateUpdateInput,
} from '../types';

type RawCommandTemplate = Omit<CommandTemplate, 'category'> & {
    category: CommandCategory | CommandCategory[] | null;
};

function normalizeTemplate(row: RawCommandTemplate): CommandTemplate {
    return {
        ...row,
        tags: Array.isArray(row.tags) ? row.tags : [],
        category: Array.isArray(row.category)
            ? (row.category[0] ?? null)
            : row.category,
    };
}

function sortCategories(categories: CommandCategory[]): CommandCategory[] {
    return [...categories].sort((a, b) => {
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        return a.name.localeCompare(b.name, 'zh-CN');
    });
}

function sortTemplates(templates: CommandTemplate[]): CommandTemplate[] {
    return [...templates].sort((a, b) => {
        const aCategoryOrder = a.category?.sort_order ?? 999;
        const bCategoryOrder = b.category?.sort_order ?? 999;
        if (aCategoryOrder !== bCategoryOrder) return aCategoryOrder - bCategoryOrder;
        if (a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1;
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        return a.command_text.localeCompare(b.command_text, 'zh-CN');
    });
}

export const commandsApi = {
    getCategories: async (activeOnly = false): Promise<CommandCategory[]> => {
        let query = supabase
            .from('command_categories')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('name', { ascending: true });

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;
        if (error) throw error;
        return sortCategories((data ?? []) as CommandCategory[]);
    },

    createCategory: async (input: CommandCategoryInput): Promise<CommandCategory> => {
        const { data, error } = await supabase
            .from('command_categories')
            .insert({
                name: input.name,
                slug: input.slug,
                description: input.description ?? null,
                sort_order: input.sort_order ?? 0,
                is_active: input.is_active ?? true,
                is_default: false,
            })
            .select()
            .single();

        if (error) throw error;
        return data as CommandCategory;
    },

    updateCategory: async (
        id: string,
        input: CommandCategoryUpdateInput,
    ): Promise<CommandCategory> => {
        const updates: CommandCategoryUpdateInput = { ...input };
        if ('description' in input) {
            updates.description = input.description ?? null;
        }

        const { data, error } = await supabase
            .from('command_categories')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as CommandCategory;
    },

    deleteCategory: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('command_categories')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    setDefaultCategory: async (id: string): Promise<CommandCategory> => {
        const clearDefault = await supabase
            .from('command_categories')
            .update({ is_default: false })
            .eq('is_default', true);

        if (clearDefault.error) throw clearDefault.error;

        const { data, error } = await supabase
            .from('command_categories')
            .update({ is_default: true })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as CommandCategory;
    },

    getTemplates: async (activeOnly = false): Promise<CommandTemplate[]> => {
        let query = supabase
            .from('command_templates')
            .select(`
                *,
                category:command_categories (
                    id,
                    name,
                    slug,
                    description,
                    sort_order,
                    is_active,
                    is_default,
                    created_at,
                    updated_at
                )
            `)
            .order('is_favorite', { ascending: false })
            .order('sort_order', { ascending: true })
            .order('command_text', { ascending: true });

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;
        if (error) throw error;

        const normalized = ((data ?? []) as RawCommandTemplate[])
            .map(normalizeTemplate)
            .filter(template => !activeOnly || template.category?.is_active);

        return sortTemplates(normalized);
    },

    createTemplate: async (input: CommandTemplateInput): Promise<CommandTemplate> => {
        const { data, error } = await supabase
            .from('command_templates')
            .insert({
                category_id: input.category_id,
                command_text: input.command_text,
                summary: input.summary,
                tags: input.tags ?? [],
                sort_order: input.sort_order ?? 0,
                is_favorite: input.is_favorite ?? false,
                is_active: input.is_active ?? true,
            })
            .select(`
                *,
                category:command_categories (*)
            `)
            .single();

        if (error) throw error;
        return normalizeTemplate(data as RawCommandTemplate);
    },

    updateTemplate: async (
        id: string,
        input: CommandTemplateUpdateInput,
    ): Promise<CommandTemplate> => {
        const { data, error } = await supabase
            .from('command_templates')
            .update(input)
            .eq('id', id)
            .select(`
                *,
                category:command_categories (*)
            `)
            .single();

        if (error) throw error;
        return normalizeTemplate(data as RawCommandTemplate);
    },

    deleteTemplate: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('command_templates')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    setTemplateActive: async (id: string, isActive: boolean): Promise<CommandTemplate> => {
        return commandsApi.updateTemplate(id, { is_active: isActive });
    },

    recordCopy: async (id: string, currentCopyCount: number): Promise<void> => {
        const { error } = await supabase
            .from('command_templates')
            .update({
                copy_count: currentCopyCount + 1,
                last_copied_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (error) throw error;
    },
};
