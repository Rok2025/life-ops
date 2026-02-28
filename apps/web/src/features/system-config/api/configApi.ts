import { supabase } from '@/lib/supabase';
import type { ConfigItem, ConfigScope, CreateConfigInput, UpdateConfigInput } from '../types';

export const configApi = {
    /** 按作用域获取配置项列表（仅激活项） */
    getActiveByScope: async (scope: ConfigScope): Promise<ConfigItem[]> => {
        const { data, error } = await supabase
            .from('system_configs')
            .select('*')
            .eq('scope', scope)
            .eq('is_active', true)
            .order('sort_order', { ascending: true });
        if (error) throw error;
        return data ?? [];
    },

    /** 按作用域获取所有配置项（包含未激活） */
    getAllByScope: async (scope: ConfigScope): Promise<ConfigItem[]> => {
        const { data, error } = await supabase
            .from('system_configs')
            .select('*')
            .eq('scope', scope)
            .order('sort_order', { ascending: true });
        if (error) throw error;
        return data ?? [];
    },

    /** 创建配置项 */
    create: async (input: CreateConfigInput): Promise<ConfigItem> => {
        const { data, error } = await supabase
            .from('system_configs')
            .insert({
                scope: input.scope,
                value: input.value,
                label: input.label,
                sort_order: input.sort_order ?? 0,
                is_active: input.is_active ?? true,
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** 更新配置项 */
    update: async (id: string, updates: UpdateConfigInput): Promise<ConfigItem> => {
        const { data, error } = await supabase
            .from('system_configs')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** 删除配置项 */
    delete: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('system_configs')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    /** 切换配置项激活状态 */
    toggleActive: async (id: string, isActive: boolean): Promise<ConfigItem> => {
        const { data, error } = await supabase
            .from('system_configs')
            .update({ is_active: isActive })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },
};
