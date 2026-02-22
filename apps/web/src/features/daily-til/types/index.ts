/** TIL 数据类型 */
export type TIL = {
    id: string;
    content: string;
    category: string | null;
    til_date: string;
    created_at: string;
};

/** 创建 TIL 的输入 */
export type CreateTilInput = {
    content: string;
    category: string | null;
    til_date: string;
};

/** 更新 TIL 的输入 */
export type UpdateTilInput = {
    content?: string;
    category?: string | null;
    til_date?: string;
};

/** TIL 分类列表 */
export const TIL_CATEGORIES = ['技术', '生活', '读书', '工作', '其他'] as const;
