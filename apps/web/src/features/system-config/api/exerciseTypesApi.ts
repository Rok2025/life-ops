import { supabase } from '@/lib/supabase';

export type ExerciseType = {
    id: string;
    name: string;
    category: string;
    tracking_mode: string;
    default_unit: string | null;
};

export const exerciseTypesApi = {
    getAll: async (): Promise<ExerciseType[]> => {
        const { data, error } = await supabase
            .from('exercise_types')
            .select('*')
            .order('category')
            .order('name');
        if (error) throw error;
        return data ?? [];
    },

    create: async (input: {
        name: string;
        category: string;
        tracking_mode: string;
        default_unit: string | null;
    }): Promise<void> => {
        const { error } = await supabase
            .from('exercise_types')
            .insert(input);
        if (error) throw error;
    },

    updateName: async (id: string, name: string): Promise<void> => {
        const { error } = await supabase
            .from('exercise_types')
            .update({ name })
            .eq('id', id);
        if (error) throw error;
    },

    delete: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('exercise_types')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },
};
