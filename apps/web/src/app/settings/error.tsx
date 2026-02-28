'use client';

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
            <button onClick={reset} className="btn-primary mt-4">
                重试
            </button>
        </div>
    );
}
