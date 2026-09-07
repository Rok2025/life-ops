/** 健身训练部位配置；其他业务 scope 在数据库清理阶段移除。 */
export type ConfigScope = 'exercise_category';

export type ScopeMeta = {
    scope: ConfigScope;
    label: string;
    description: string;
};

export const CONFIG_SCOPES: ScopeMeta[] = [
    {
        scope: 'exercise_category',
        label: '训练部位',
        description: '管理健身训练的肌群分类',
    },
];

export type ConfigItem = {
    id: string;
    scope: ConfigScope;
    value: string;
    label: string;
    sort_order: number;
    is_active: boolean;
    created_at: string;
};

export type CreateConfigInput = {
    scope: ConfigScope;
    value: string;
    label: string;
    sort_order?: number;
    is_active?: boolean;
};

export type UpdateConfigInput = {
    value?: string;
    label?: string;
    sort_order?: number;
    is_active?: boolean;
};
