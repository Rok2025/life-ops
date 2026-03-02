import { supabase } from '@/lib/supabase';
import type {
    CreatePromptTemplateInput,
    PromptTemplate,
    PromptTemplateFilters,
    UpdatePromptTemplateInput,
} from '../types';

function sanitizeLikeTerm(term: string): string {
    return term.replace(/[,%_()]/g, ' ').trim();
}

export const promptTemplatesApi = {
    getAll: async (filters: PromptTemplateFilters = {}): Promise<PromptTemplate[]> => {
        let query = supabase
            .from('prompt_templates')
            .select('*')
            .order('is_favorite', { ascending: false })
            .order('updated_at', { ascending: false });

        if (filters.favoritesOnly) {
            query = query.eq('is_favorite', true);
        }

        if (filters.tag) {
            query = query.contains('tags', [filters.tag]);
        }

        const searchTerm = sanitizeLikeTerm(filters.search ?? '');
        if (searchTerm) {
            query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data ?? [];
    },

    create: async (input: CreatePromptTemplateInput): Promise<PromptTemplate> => {
        const { data, error } = await supabase
            .from('prompt_templates')
            .insert({
                title: input.title,
                description: input.description ?? null,
                content: input.content,
                tags: input.tags ?? [],
                is_favorite: input.is_favorite ?? false,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    update: async (id: string, input: UpdatePromptTemplateInput): Promise<PromptTemplate> => {
        const { data, error } = await supabase
            .from('prompt_templates')
            .update({
                ...input,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    delete: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('prompt_templates')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    toggleFavorite: async (id: string, isFavorite: boolean): Promise<PromptTemplate> => {
        const { data, error } = await supabase
            .from('prompt_templates')
            .update({
                is_favorite: isFavorite,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    recordUse: async (id: string, currentCount: number): Promise<PromptTemplate> => {
        const now = new Date().toISOString();
        const { data, error } = await supabase
            .from('prompt_templates')
            .update({
                use_count: currentCount + 1,
                last_used_at: now,
                updated_at: now,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    duplicate: async (template: PromptTemplate): Promise<PromptTemplate> => {
        const copyTitle = template.title.includes('（副本）')
            ? `${template.title}-${Date.now()}`
            : `${template.title}（副本）`;

        return promptTemplatesApi.create({
            title: copyTitle,
            description: template.description,
            content: template.content,
            tags: template.tags,
            is_favorite: false,
        });
    },
};
