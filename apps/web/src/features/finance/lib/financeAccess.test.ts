import { describe, expect, it, vi } from 'vitest';

import { verifyFinanceAccessPassword } from './financeAccess';

describe('verifyFinanceAccessPassword', () => {
    it('verifies finance access with the current login email and password', async () => {
        const signInWithPassword = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);

        await verifyFinanceAccessPassword({
            email: 'user@example.com',
            password: 'same-login-password',
            signInWithPassword,
        });

        expect(signInWithPassword).toHaveBeenCalledWith('user@example.com', 'same-login-password');
    });

    it('rejects access when the current user has no email to reauthenticate', async () => {
        const signInWithPassword = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);

        await expect(
            verifyFinanceAccessPassword({
                email: null,
                password: 'same-login-password',
                signInWithPassword,
            }),
        ).rejects.toThrow('当前账号缺少邮箱，无法验证访问密码。');
        expect(signInWithPassword).not.toHaveBeenCalled();
    });
});
