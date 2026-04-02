import { supabase } from '@/lib/supabase';
import type { WordBankEntry, WordBankImportResult } from '../types';
import { parseLongmanMarkdown, summarizeImport } from '../utils/longmanParser';

const IMPORT_BATCH_SIZE = 200;

export const wordBankApi = {
    getStats: async (): Promise<{ total: number }> => {
        const { count, error } = await supabase
            .from('english_word_bank')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;
        return { total: count ?? 0 };
    },

    getPlanningWords: async (): Promise<WordBankEntry[]> => {
        const { data, error } = await supabase
            .from('english_word_bank')
            .select('*')
            .order('term', { ascending: true });

        if (error) throw error;
        return (data ?? []) as WordBankEntry[];
    },

    importMarkdown: async (markdown: string): Promise<WordBankImportResult> => {
        const entries = parseLongmanMarkdown(markdown);
        if (entries.length === 0) {
            throw new Error('没有从 Markdown 中解析出 Longman 单词，请检查文件格式。');
        }

        const totalBatches = Math.ceil(entries.length / IMPORT_BATCH_SIZE);

        for (let index = 0; index < entries.length; index += IMPORT_BATCH_SIZE) {
            const batchNum = Math.floor(index / IMPORT_BATCH_SIZE) + 1;
            const batch = entries.slice(index, index + IMPORT_BATCH_SIZE);
            const { error } = await supabase
                .from('english_word_bank')
                .upsert(batch, { onConflict: 'term,pos,source' });

            if (error) {
                throw new Error(
                    `导入第 ${batchNum}/${totalBatches} 批次失败（共 ${entries.length} 条）：${error.message}`,
                );
            }
        }

        return summarizeImport(entries);
    },
};
