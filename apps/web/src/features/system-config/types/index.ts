/** 配置项作用域 */
export type ConfigScope = 'til_category' | 'exercise_category';

/** 配置项作用域元信息 */
export type ScopeMeta = {
    scope: ConfigScope;
    label: string;
    description: string;
};

/** 所有可管理的作用域定义 */
export const CONFIG_SCOPES: ScopeMeta[] = [
    {
        scope: 'til_category',
        label: 'TIL 分类',
        description: '管理「今天我学到了」的分类标签',
    },
    {
        scope: 'exercise_category',
        label: '训练部位',
        description: '管理健身训练的肌群分类',
    },
];

/** 配置项数据类型 */
export type ConfigItem = {
    id: string;
    scope: ConfigScope;
    value: string;
    label: string;
    sort_order: number;
    is_active: boolean;
    created_at: string;
};

/** 创建配置项的输入 */
export type CreateConfigInput = {
    scope: ConfigScope;
    value: string;
    label: string;
    sort_order?: number;
    is_active?: boolean;
};

/** 更新配置项的输入 */
export type UpdateConfigInput = {
    value?: string;
    label?: string;
    sort_order?: number;
    is_active?: boolean;
};
