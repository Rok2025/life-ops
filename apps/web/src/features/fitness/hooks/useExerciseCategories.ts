'use client';

import { useState, useCallback, useEffect } from 'react';
import { configApi } from '@/features/system-config/api/configApi';
import type { ConfigItem } from '@/features/system-config/types';

/**
 * 获取训练部位分类映射 { value → label }
 * 例如 { chest: '胸部', back: '背部', ... }
 */
export function useExerciseCategories() {
    const [categories, setCategories] = useState<Record<string, string>>({});
    const [categoryList, setCategoryList] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const items = await configApi.getActiveByScope('exercise_category');
            const map: Record<string, string> = {};
            const keys: string[] = [];
            for (const item of items) {
                map[item.value] = item.label;
                keys.push(item.value);
            }
            setCategories(map);
            setCategoryList(keys);
        } catch (err) {
            console.error('加载训练部位分类失败:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return { categories, categoryList, loading, reload: load };
}
