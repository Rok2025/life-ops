import { supabase } from '@/lib/supabase';

export const authApi = {
    /** 邮箱密码登录 */
    signInWithPassword: async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    },

    /** 邮箱注册 */
    signUp: async (email: string, password: string) => {
        const callbackUrl = `${window.location.origin}${process.env.NODE_ENV === 'production' ? '/life-ops' : ''}/auth/callback`;

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: callbackUrl },
        });
        if (error) throw error;

        return {
            /** 是否已自动登录（关闭邮件验证时） */
            autoSignedIn: !!(data.user && data.session),
        };
    },

    /** OAuth 回调：用 code 换取 session */
    exchangeCodeForSession: async (code: string) => {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
    },
};
