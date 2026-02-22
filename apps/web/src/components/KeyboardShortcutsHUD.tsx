'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { ShortcutDef } from '@/types/shortcuts';

type Props = {
    show: boolean;
    onClose: () => void;
    shortcuts: ShortcutDef[];
    prefix: string | null;
};

function Kbd({ children }: { children: React.ReactNode }) {
    return (
        <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-md bg-bg-tertiary border border-border text-xs font-mono text-text-primary shadow-sm">
            {children}
        </kbd>
    );
}

export default function KeyboardShortcutsHUD({ show, onClose, shortcuts, prefix }: Props) {
    // Escape 关闭
    useEffect(() => {
        if (!show) return;
        function handleKey(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        }
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [show, onClose]);

    const navShortcuts = shortcuts.filter(s => s.category === 'nav');
    const createShortcuts = shortcuts.filter(s => s.category === 'create');

    return (
        <>
            {/* 前缀指示器 */}
            {prefix && !show && (
                <div className="fixed bottom-6 right-6 z-50 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bg-secondary/95 backdrop-blur-xl border border-border shadow-lg">
                        <Kbd>{prefix}</Kbd>
                        <span className="text-sm text-text-secondary animate-pulse">…</span>
                    </div>
                </div>
            )}

            {/* HUD 弹窗 */}
            {show && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center"
                    onClick={onClose}
                >
                    {/* 背景遮罩 */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

                    {/* 弹窗内容 */}
                    <div
                        className="relative w-full max-w-lg mx-4 rounded-2xl bg-bg-secondary/95 backdrop-blur-xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                            <h2 className="text-lg font-semibold text-text-primary">⌨️ 键盘快捷键</h2>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg hover:bg-bg-tertiary transition-colors"
                            >
                                <X size={18} className="text-text-secondary" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-5 grid grid-cols-2 gap-8">
                            {/* 导航 */}
                            <div>
                                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                                    导航 <span className="text-text-secondary/60 normal-case">Go to</span>
                                </h3>
                                <div className="space-y-2">
                                    {navShortcuts.map((s) => {
                                        const [first, second] = s.keys.split(' ');
                                        return (
                                            <div key={s.keys} className="flex items-center justify-between py-1">
                                                <span className="text-sm text-text-primary">{s.label}</span>
                                                <div className="flex items-center gap-1">
                                                    <Kbd>{first}</Kbd>
                                                    <span className="text-text-secondary/40 text-xs">→</span>
                                                    <Kbd>{second}</Kbd>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 新建 */}
                            <div>
                                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                                    新建 <span className="text-text-secondary/60 normal-case">New</span>
                                </h3>
                                <div className="space-y-2">
                                    {createShortcuts.map((s) => {
                                        const [first, second] = s.keys.split(' ');
                                        return (
                                            <div key={s.keys} className="flex items-center justify-between py-1">
                                                <span className="text-sm text-text-primary">{s.label}</span>
                                                <div className="flex items-center gap-1">
                                                    <Kbd>{first}</Kbd>
                                                    <span className="text-text-secondary/40 text-xs">→</span>
                                                    <Kbd>{second}</Kbd>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 border-t border-border bg-bg-tertiary/50">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-text-secondary">
                                    💡 在输入框中时快捷键不生效
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-text-secondary">按</span>
                                    <Kbd>?</Kbd>
                                    <span className="text-xs text-text-secondary">关闭</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
