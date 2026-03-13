'use client';

import { Button } from '@/components/ui';

export default function SettingsError({
    error,
    reset,
}: {
    error: Error;
    reset: () => void;
}) {
    return (
        <div className="max-w-2xl mx-auto text-center py-12">
            <p className="text-danger">加载配置失败：{error.message}</p>
            <Button onClick={reset} className="mt-4">
                重试
            </Button>
        </div>
    );
}
