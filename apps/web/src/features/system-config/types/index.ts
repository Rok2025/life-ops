/** 配置项作用域 */
export type ConfigScope = 'til_category' | 'exercise_category' | 'project_scope' | 'output_type' | 'family_task_category';

/** 配置项作用域元信息 */
export type ScopeMeta = {
    scope: ConfigScope;
    label: string;
    description: string;
    /** Navigation group for the settings sidebar */
    group: 'general' | 'fitness' | 'family';
};

/** 所有可管理的作用域定义 */
export const CONFIG_SCOPES: ScopeMeta[] = [
    {
        scope: 'til_category',
        label: 'TIL 分类',
        description: '管理「今天我学到了」的分类标签',
        group: 'general',
    },
    {
        scope: 'project_scope',
        label: '项目范围',
        description: '管理项目的时间范围分类（年度/季度/月）',
        group: 'general',
    },
    {
        scope: 'output_type',
        label: '输出类型',
        description: '管理输出内容的类型分类（博客/推文/代码等）',
        group: 'general',
    },
    {
        scope: 'exercise_category',
        label: '训练部位',
        description: '管理健身训练的肌群分类',
        group: 'fitness',
    },
    {
        scope: 'family_task_category',
        label: '家务分类',
        description: '管理家庭任务的分类标签（家务/采购/预约等）',
        group: 'family',
    },
];

/** Navigation section definitions */
export type SettingsSection =
    | { type: 'scope'; scope: ConfigScope }
    | { type: 'exercise' }
    | { type: 'english-prompts' };

export type SettingsNavItem = {
    id: string;
    label: string;
    section: SettingsSection;
    group: string;
};

export type SettingsNavGroup = {
    label: string;
    items: SettingsNavItem[];
};

export const SETTINGS_NAV: SettingsNavGroup[] = [
    {
        label: '通用',
        items: [
            { id: 'til_category', label: 'TIL 分类', section: { type: 'scope', scope: 'til_category' }, group: '通用' },
            { id: 'project_scope', label: '项目范围', section: { type: 'scope', scope: 'project_scope' }, group: '通用' },
            { id: 'output_type', label: '输出类型', section: { type: 'scope', scope: 'output_type' }, group: '通用' },
        ],
    },
    {
        label: '健身',
        items: [
            { id: 'exercise_category', label: '训练部位', section: { type: 'scope', scope: 'exercise_category' }, group: '健身' },
            { id: 'exercise', label: '训练动作', section: { type: 'exercise' }, group: '健身' },
        ],
    },
    {
        label: '家庭',
        items: [
            { id: 'family_task_category', label: '家务分类', section: { type: 'scope', scope: 'family_task_category' }, group: '家庭' },
        ],
    },
    {
        label: '英语',
        items: [
            { id: 'english-prompts', label: '提示词模板', section: { type: 'english-prompts' }, group: '英语' },
        ],
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
