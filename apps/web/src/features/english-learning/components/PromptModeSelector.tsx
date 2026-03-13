'use client';

import { PROMPT_MODES } from '../constants';
import type { PromptMode } from '../types';

interface PromptModeSelectorProps {
    mode: PromptMode;
    onModeChange: (mode: PromptMode) => void;
    customInstruction: string;
    onCustomInstructionChange: (value: string) => void;
}

export default function PromptModeSelector({
    mode,
    onModeChange,
    customInstruction,
    onCustomInstructionChange,
}: PromptModeSelectorProps) {
    return (
        <div className="space-y-2">
            {/* Mode Tabs */}
            <div className="flex gap-1 bg-bg-tertiary rounded-control p-1">
                {PROMPT_MODES.map(({ key, label, description }) => (
                    <button
                        key={key}
                        onClick={() => onModeChange(key)}
                        title={description}
                        className={`flex-1 px-3 py-1.5 rounded-md text-caption font-medium transition-colors ${
                            mode === key
                                ? 'bg-bg-primary text-accent shadow-sm'
                                : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Custom Instruction */}
            <input
                type="text"
                value={customInstruction}
                onChange={e => onCustomInstructionChange(e.target.value)}
                placeholder="追加自定义指令（可选，如：给出更多例句、分析词根...）"
                className="w-full px-3 py-2 rounded-control border border-border bg-bg-primary text-text-primary text-body-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
        </div>
    );
}
