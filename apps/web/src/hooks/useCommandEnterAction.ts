'use client';

import { useEffect, type RefObject } from 'react';
import { isCommandEnterEvent } from '@/lib/shortcuts';

interface UseCommandEnterActionOptions {
    enabled?: boolean;
    disabled?: boolean;
    scopeRef?: RefObject<HTMLElement | null>;
    onAction: () => void;
}

export function useCommandEnterAction({
    enabled = true,
    disabled = false,
    scopeRef,
    onAction,
}: UseCommandEnterActionOptions): void {
    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (disabled || !isCommandEnterEvent(event)) return;
            const scope = scopeRef?.current;
            if (scopeRef && !scope) return;
            if (scope && event.target instanceof Node && !scope.contains(event.target)) return;

            event.preventDefault();
            onAction();
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [disabled, enabled, onAction, scopeRef]);
}
