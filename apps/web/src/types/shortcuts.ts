/** 快捷键定义 */
export type ShortcutDef = {
    keys: string;
    label: string;
    category: 'nav' | 'create';
    action?: () => void;
};
