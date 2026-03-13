import { TONES, type ToneTokenClasses } from '@/design-system/tokens';

/** 输出类型 */
export type OutputType = 'blog' | 'tweet' | 'code' | 'note' | 'share';

/** 输出状态 */
export type OutputStatus = 'draft' | 'published';

/** 输出类型配置 */
export const OUTPUT_TYPE_CONFIG: Record<OutputType, { label: string; emoji: string } & ToneTokenClasses> = {
    blog: { label: '博客', emoji: '📝', ...TONES.blue },
    tweet: { label: '推文', emoji: '🐦', ...TONES.sky },
    code: { label: '代码', emoji: '💻', ...TONES.green },
    note: { label: '笔记', emoji: '📋', ...TONES.yellow },
    share: { label: '分享', emoji: '🔗', ...TONES.purple },
};

/** 输出状态配置 */
export const OUTPUT_STATUS_CONFIG: Record<OutputStatus, { label: string } & ToneTokenClasses> = {
    draft: { label: '草稿', ...TONES.warning },
    published: { label: '已发布', ...TONES.success },
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
