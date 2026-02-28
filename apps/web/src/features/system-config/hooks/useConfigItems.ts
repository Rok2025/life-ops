'use client';

import { useState, useCallback, useEffect } from 'react';
import { configApi } from '../api/configApi';
import type { ConfigItem, ConfigScope } from '../types';

/** 获取指定 scope 的激活配置项 */
export function useConfigItems(scope: ConfigScope) {
    const [items, setItems] = useState<ConfigItem[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await configApi.getActiveByScope(scope);
            setItems(data);
        } catch (err) {
            console.error(`加载配置 [${scope}] 失败:`, err);
        } finally {
            setLoading(false);
        }
    }, [scope]);

    useEffect(() => {
        load();
    }, [load]);

    return { items, loading, reload: load };
}
