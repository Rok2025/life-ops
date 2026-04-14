import { supabase } from '@/lib/supabase';
import type {
    Vaccination,
    CreateVaccinationInput,
    UpdateVaccinationInput,
    MedicalRecord,
    CreateMedicalRecordInput,
    UpdateMedicalRecordInput,
    MedicalRecordType,
} from '../types';

export const healthApi = {
    // ── 疫苗 ────────────────────────────────────────────

    /** 获取全部疫苗记录（按 sort_order 升序） */
    getVaccinations: async (): Promise<Vaccination[]> => {
        const { data, error } = await supabase
            .from('youyou_vaccinations')
            .select('*')
            .order('sort_order', { ascending: true });
        if (error) throw error;
        return data ?? [];
    },

    /** 创建疫苗 */
    createVaccination: async (input: CreateVaccinationInput): Promise<Vaccination> => {
        const { data, error } = await supabase
            .from('youyou_vaccinations')
            .insert(input)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** 更新疫苗（标记已接种等） */
    updateVaccination: async (id: string, updates: UpdateVaccinationInput): Promise<Vaccination> => {
        const { data, error } = await supabase
            .from('youyou_vaccinations')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** 标记已接种 */
    markVaccinated: async (id: string, actualDate?: string): Promise<Vaccination> => {
        const { data, error } = await supabase
            .from('youyou_vaccinations')
            .update({ actual_date: actualDate ?? new Date().toISOString().slice(0, 10) })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** 取消标记已接种 */
    unmarkVaccinated: async (id: string): Promise<Vaccination> => {
        const { data, error } = await supabase
            .from('youyou_vaccinations')
            .update({ actual_date: null })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** 删除疫苗 */
    deleteVaccination: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('youyou_vaccinations')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    /** 疫苗统计 */
    getVaccinationStats: async (): Promise<{ total: number; completed: number }> => {
        const { data, error } = await supabase
            .from('youyou_vaccinations')
            .select('actual_date');
        if (error) throw error;
        const all = data ?? [];
        return {
            total: all.length,
            completed: all.filter(v => v.actual_date).length,
        };
    },

    // ── 就医记录 ────────────────────────────────────────

    /** 获取就医记录列表（按日期倒序） */
    getMedicalRecords: async (type?: MedicalRecordType): Promise<MedicalRecord[]> => {
        let query = supabase
            .from('youyou_medical_records')
            .select('*')
            .order('date', { ascending: false });
        if (type) query = query.eq('type', type);
        const { data, error } = await query;
        if (error) throw error;
        return data ?? [];
    },

    /** 创建就医记录 */
    createMedicalRecord: async (input: CreateMedicalRecordInput): Promise<MedicalRecord> => {
        const { data, error } = await supabase
            .from('youyou_medical_records')
            .insert(input)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** 更新就医记录 */
    updateMedicalRecord: async (id: string, updates: UpdateMedicalRecordInput): Promise<MedicalRecord> => {
        const { data, error } = await supabase
            .from('youyou_medical_records')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** 删除就医记录 */
    deleteMedicalRecord: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('youyou_medical_records')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    /** 就医记录统计 */
    getMedicalStats: async (): Promise<{ total: number }> => {
        const { count, error } = await supabase
            .from('youyou_medical_records')
            .select('*', { count: 'exact', head: true });
        if (error) throw error;
        return { total: count ?? 0 };
    },
};
