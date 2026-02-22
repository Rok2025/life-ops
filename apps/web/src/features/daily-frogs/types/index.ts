/** 青蛙数据类型 */
export type Frog = {
    id: string;
    title: string;
    description: string | null;
    is_completed: boolean;
    frog_date: string;
    completed_at: string | null;
    created_at: string;
};

/** 创建青蛙的输入 */
export type CreateFrogInput = {
    title: string;
    frog_date: string;
};

/** 更新青蛙的输入 */
export type UpdateFrogInput = {
    title?: string;
    frog_date?: string;
    is_completed?: boolean;
    completed_at?: string | null;
};
