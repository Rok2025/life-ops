'use client';

import { PROMPT_MODES } from '../constants';
import type { PromptMode } from '../types';
import { Input, SegmentedControl } from '@/components/ui';

interface PromptModeSelectorProps {
    mode: PromptMode;
    onModeChange: (mode: PromptMode) => void;
    customInstruction: string;
    onCustomInstructionChange: (value: string) => void;
    disabled?: boolean;
}

export default function PromptModeSelector({
    mode,
    onModeChange,
    customInstruction,
    onCustomInstructionChange,
    disabled = false,
}: PromptModeSelectorProps) {
    const options = PROMPT_MODES.map(({ key, label, description }) => ({
        value: key,
        label,
        title: description,
        disabled,
    }));

    return (
        <div className="space-y-2">
            <SegmentedControl
                value={mode}
                onChange={(next) => onModeChange(next as PromptMode)}
                options={options}
                fullWidth
                aria-label="提示词模式"
            />

            <Input
                type="text"
                value={customInstruction}
                onChange={e => onCustomInstructionChange(e.target.value)}
                placeholder="追加自定义指令（可选，如：给出更多例句、分析词根...）"
                disabled={disabled}
            />
        </div>
    );
}
