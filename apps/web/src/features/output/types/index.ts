/** 输出类型 */
export type OutputType = 'blog' | 'tweet' | 'code' | 'note' | 'share';

/** 输出状态 */
export type OutputStatus = 'draft' | 'published';

/** 输出类型配置 */
export const OUTPUT_TYPE_CONFIG: Record<OutputType, { label: string; emoji: string; color: string; bg: string }> = {
    blog: { label: '博客', emoji: '📝', color: 'text-blue-400', bg: 'bg-blue-500/20' },
    tweet: { label: '推文', emoji: '🐦', color: 'text-sky-400', bg: 'bg-sky-500/20' },
    code: { label: '代码', emoji: '💻', color: 'text-green-400', bg: 'bg-green-500/20' },
    note: { label: '笔记', emoji: '📋', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    share: { label: '分享', emoji: '🔗', color: 'text-purple-400', bg: 'bg-purple-500/20' },
};

/** 输出状态配置 */
export const OUTPUT_STATUS_CONFIG: Record<OutputStatus, { label: string; color: string; bg: string }> = {
    draft: { label: '草稿', color: 'text-warning', bg: 'bg-warning/20' },
    published: { label: '已发布', color: 'text-success', bg: 'bg-success/20' },
};

/** 输出数据类型 */
export type Output = {
    id: string;
    project_id: string | null;
    title: string;
    type: OutputType;
    content: string | null;
    url: string | null;
    status: OutputStatus;
    created_at: string;
    updated_at: string;
};

/** 输出 + 项目信息（用于列表展示） */
export type OutputWithProject = Output & {
    project_title?: string;
    project_area?: string;
};

/** 创建输出输入 */
export type CreateOutputInput = {
    project_id?: string;
    title: string;
    type: OutputType;
    content?: string;
    url?: string;
    status?: OutputStatus;
};

/** 更新输出输入 */
export type UpdateOutputInput = {
    project_id?: string | null;
    title?: string;
    type?: OutputType;
    content?: string | null;
    url?: string | null;
    status?: OutputStatus;
};
