import { supabase } from '@/lib/supabase';
import type {
    CreateEnglishPromptTemplateInput,
    EnglishPromptMode,
    EnglishPromptModeBinding,
    EnglishPromptTemplate,
    UpdateEnglishPromptTemplateInput,
} from '../types';

type RawEnglishPromptModeBinding = {
    mode: EnglishPromptMode;
    template_id: string | null;
    updated_at: string;
    template: EnglishPromptTemplate | EnglishPromptTemplate[] | null;
};

function normalizeBinding(row: RawEnglishPromptModeBinding): EnglishPromptModeBinding {
    return {
        mode: row.mode,
        template_id: row.template_id,
        updated_at: row.updated_at,
        template: Array.isArray(row.template)
            ? (row.template[0] ?? null)
            : row.template,
    };
}

export const englishPromptApi = {
    getTemplates: async (): Promise<EnglishPromptTemplate[]> => {
        const { data, error } = await supabase
            .from('english_prompt_templates')
            .select('*')
            .order('is_active', { ascending: false })
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data ?? [];
    },

    createTemplate: async (input: CreateEnglishPromptTemplateInput): Promise<EnglishPromptTemplate> => {
        const { data, error } = await supabase
            .from('english_prompt_templates')
            .insert({
                title: input.title,
                description: input.description ?? null,
                content: input.content,
                supported_modes: input.supported_modes,
                is_active: input.is_active ?? true,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    updateTemplate: async (
        id: string,
        input: UpdateEnglishPromptTemplateInput,
    ): Promise<EnglishPromptTemplate> => {
        const { data, error } = await supabase
            .from('english_prompt_templates')
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

    deleteTemplate: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('english_prompt_templates')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    setTemplateActive: async (id: string, isActive: boolean): Promise<EnglishPromptTemplate> => {
        const { data, error } = await supabase
            .from('english_prompt_templates')
            .update({
                is_active: isActive,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    getBindings: async (): Promise<EnglishPromptModeBinding[]> => {
        const { data, error } = await supabase
            .from('english_prompt_mode_bindings')
            .select(`
                mode,
                template_id,
                updated_at,
                template:english_prompt_templates (
                    id,
                    title,
                    description,
                    content,
                    supported_modes,
                    is_active,
                    created_at,
                    updated_at
                )
            `)
            .order('mode', { ascending: true });

        if (error) throw error;
        return ((data ?? []) as RawEnglishPromptModeBinding[]).map(normalizeBinding);
    },

    setBinding: async (mode: EnglishPromptMode, templateId: string | null): Promise<EnglishPromptModeBinding> => {
        const { data, error } = await supabase
            .from('english_prompt_mode_bindings')
            .upsert({
                mode,
                template_id: templateId,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'mode' })
            .select(`
                mode,
                template_id,
                updated_at,
                template:english_prompt_templates (
                    id,
                    title,
                    description,
                    content,
                    supported_modes,
                    is_active,
                    created_at,
                    updated_at
                )
            `)
            .single();

        if (error) throw error;
        return normalizeBinding(data as RawEnglishPromptModeBinding);
    },
};
