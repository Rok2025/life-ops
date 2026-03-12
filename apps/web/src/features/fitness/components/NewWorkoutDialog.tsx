'use client';

import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import NewWorkoutForm from './NewWorkoutForm';

interface NewWorkoutDialogProps {
    open: boolean;
    onClose: () => void;
}

export function NewWorkoutDialog({ open, onClose }: NewWorkoutDialogProps) {
    // ESC 关闭
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        },
        [onClose],
    );

    useEffect(() => {
        if (!open) return;
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [open, handleKeyDown]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* 遮罩 */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* 弹窗内容 */}
            <div className="relative w-full max-w-2xl mx-4 bg-bg-primary border border-border rounded-2xl shadow-2xl flex flex-col">
                {/* 顶栏 */}
                <div className="flex items-center justify-between px-5 py-2.5 border-b border-border">
                    <h2 className="text-base font-bold text-text-primary">
                        添加训练记录
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* 表单主体 */}
                <div className="px-5 py-3">
                    <NewWorkoutForm onSaved={onClose} />
                </div>
            </div>
        </div>
    );
}
