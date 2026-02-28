'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { configApi } from '../api/configApi';
import type { ConfigItem, ConfigScope } from '../types';

/** 获取指定 scope 的激活配置项 */
export function useConfigItems(scope: ConfigScope) {
    const queryClient = useQueryClient();

    const query = useQuery<ConfigItem[]>({
        queryKey: ['config-items-active', scope],
        queryFn: () => configApi.getActiveByScope(scope),
    });

    const reload = () => queryClient.invalidateQueries({ queryKey: ['config-items-active', scope] });

    return { items: query.data ?? [], loading: query.isLoading, reload };
}
