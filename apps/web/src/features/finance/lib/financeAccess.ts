type VerifyFinanceAccessPasswordInput = {
    email: string | null | undefined;
    password: string;
    signInWithPassword: (email: string, password: string) => Promise<void>;
};

export async function verifyFinanceAccessPassword({
    email,
    password,
    signInWithPassword,
}: VerifyFinanceAccessPasswordInput): Promise<void> {
    const normalizedEmail = email?.trim();

    if (!normalizedEmail) {
        throw new Error('当前账号缺少邮箱，无法验证访问密码。');
    }

    await signInWithPassword(normalizedEmail, password);
}
