'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('页面错误:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <div className="w-16 h-16 rounded-full bg-danger/20 flex items-center justify-center mb-6">
                <AlertTriangle size={32} className="text-danger" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
                出了点问题
            </h2>
            <p className="text-text-secondary mb-6 max-w-md">
                {error.message || '页面加载时出现了意外错误，请稍后重试。'}
            </p>
            <button
                onClick={reset}
                className="btn-primary inline-flex items-center gap-2"
            >
                <RotateCcw size={16} />
                重新加载
            </button>
        </div>
    );
}
