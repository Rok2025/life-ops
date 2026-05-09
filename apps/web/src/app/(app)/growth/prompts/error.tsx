'use client';

interface GrowthPromptsErrorProps {
    error: Error;
    reset: () => void;
}

export default function GrowthPromptsError({ error, reset }: GrowthPromptsErrorProps) {
    return (
        <div className="rounded-card border border-danger/30 bg-danger/10 p-card text-body-sm text-danger">
            <p>提示词库页面加载失败：{error.message}</p>
            <button
                type="button"
                onClick={reset}
                className="mt-2 rounded-md border border-danger/40 px-2 py-1 text-caption hover:bg-danger/15"
            >
                重试
            </button>
        </div>
    );
}
