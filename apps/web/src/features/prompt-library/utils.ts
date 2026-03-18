export function resolveSubmitErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    if (typeof error === 'object' && error !== null) {
        const maybeMessage = Reflect.get(error, 'message');
        const maybeCode = Reflect.get(error, 'code');
        if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
            if (maybeMessage.includes('relation') && maybeMessage.includes('prompt_templates')) {
                return '数据库缺少 prompt_templates 表，请先执行迁移：supabase/migrations/20260303_create_prompt_templates.sql';
            }
            if (maybeMessage.toLowerCase().includes('row-level security')) {
                return '当前账号没有写入权限，请检查 Supabase RLS 策略（prompt_templates）。';
            }
            return typeof maybeCode === 'string'
                ? `${maybeMessage} (code: ${maybeCode})`
                : maybeMessage;
        }
    }

    return fallback;
}

export async function copyToClipboard(text: string): Promise<void> {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
    }

    if (typeof document === 'undefined') {
        throw new Error('Clipboard API unavailable');
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}
