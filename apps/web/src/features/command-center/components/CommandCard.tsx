'use client';

import { Check, Copy, Terminal } from 'lucide-react';
import type { CommandTemplate } from '../types';
import { Button, Card } from '@/components/ui';

interface CommandCardProps {
    command: CommandTemplate;
    copied: boolean;
    onCopy: (command: CommandTemplate) => void;
}

export default function CommandCard({ command, copied, onCopy }: CommandCardProps) {
    return (
        <Card variant="subtle" className="p-3">
            <div className="flex h-full min-h-[112px] flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2.5">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-accent/18 bg-accent/10 text-accent">
                            <Terminal size={16} />
                        </span>
                        <div className="min-w-0">
                            <code className="block break-all text-code font-semibold text-text-primary">
                                {command.command_text}
                            </code>
                            <p className="mt-1 line-clamp-2 text-body-sm text-text-secondary">
                                {command.summary}
                            </p>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant={copied ? 'secondary' : 'tinted'}
                        size="sm"
                        onClick={() => onCopy(command)}
                        className="shrink-0 gap-1 px-2.5"
                        title="复制命令"
                    >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copied ? '已复制' : '复制'}</span>
                    </Button>
                </div>

                <div className="mt-auto flex items-center justify-between gap-2">
                    <span className="glass-mini-chip truncate text-caption">
                        {command.category?.name ?? '未分类'}
                    </span>
                    {command.is_favorite ? (
                        <span className="text-caption font-medium text-warning">高频</span>
                    ) : null}
                </div>
            </div>
        </Card>
    );
}
