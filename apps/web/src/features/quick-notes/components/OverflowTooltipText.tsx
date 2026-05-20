'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CSSProperties } from 'react';

interface OverflowTooltipTextProps {
    text: string;
    className?: string;
    tooltipClassName?: string;
}

type TooltipAnchorRect = Pick<DOMRect, 'left' | 'right' | 'top' | 'bottom' | 'width' | 'height'>;

type TooltipPositionOptions = {
    viewportWidth: number;
    viewportHeight: number;
    maxWidth?: number;
    margin?: number;
    gap?: number;
};

type TooltipPosition = {
    left: number;
    top: number;
    maxWidth: number;
};

export function getOverflowTooltipPopoverClassName(tooltipClassName?: string): string {
    return [
        'pointer-events-none fixed z-[1000] w-max rounded-popover border border-glass-border bg-panel-bg/96 px-3 py-2 text-body-sm text-text-primary shadow-lg shadow-black/8',
        tooltipClassName,
    ].filter(Boolean).join(' ');
}

export function getOverflowTooltipPosition(
    anchorRect: TooltipAnchorRect,
    options: TooltipPositionOptions,
): TooltipPosition {
    const margin = options.margin ?? 16;
    const gap = options.gap ?? 6;
    const maxWidth = Math.max(0, Math.min(options.maxWidth ?? 512, options.viewportWidth - margin * 2));
    const maxLeft = Math.max(margin, options.viewportWidth - margin - maxWidth);

    return {
        left: Math.min(Math.max(anchorRect.left, margin), maxLeft),
        top: Math.min(anchorRect.bottom + gap, Math.max(margin, options.viewportHeight - margin)),
        maxWidth,
    };
}

export function OverflowTooltipText({ text, className, tooltipClassName }: OverflowTooltipTextProps) {
    const textRef = useRef<HTMLDivElement | null>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState<TooltipPosition | null>(null);

    useEffect(() => {
        const element = textRef.current;
        if (!element) return;

        let frameId = 0;

        const checkOverflow = () => {
            cancelAnimationFrame(frameId);
            frameId = requestAnimationFrame(() => {
                const next = element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight;
                setIsOverflowing((current) => (current === next ? current : next));
            });
        };

        checkOverflow();

        const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(checkOverflow) : null;
        resizeObserver?.observe(element);

        if (element.parentElement) {
            resizeObserver?.observe(element.parentElement);
        }

        window.addEventListener('resize', checkOverflow);

        return () => {
            cancelAnimationFrame(frameId);
            resizeObserver?.disconnect();
            window.removeEventListener('resize', checkOverflow);
        };
    }, [text]);

    const updatePosition = useCallback(() => {
        const element = textRef.current;
        if (!element || typeof window === 'undefined') return;

        setPosition(getOverflowTooltipPosition(element.getBoundingClientRect(), {
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
        }));
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isOpen, updatePosition]);

    const handleOpen = useCallback(() => {
        if (!isOverflowing) return;
        updatePosition();
        setIsOpen(true);
    }, [isOverflowing, updatePosition]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
    }, []);

    const tooltipStyle: CSSProperties | undefined = position
        ? {
            left: position.left,
            top: position.top,
            maxWidth: position.maxWidth,
        }
        : undefined;

    return (
        <div
            className="relative min-w-0"
            onMouseEnter={handleOpen}
            onMouseLeave={handleClose}
            onFocus={handleOpen}
            onBlur={handleClose}
        >
            <div ref={textRef} className={className}>
                {text}
            </div>

            {isOverflowing && isOpen && position && typeof document !== 'undefined'
                ? createPortal(
                    <div className={getOverflowTooltipPopoverClassName(tooltipClassName)} style={tooltipStyle}>
                        <div className="whitespace-normal wrap-break-word">{text}</div>
                    </div>,
                    document.body,
                )
                : null}
        </div>
    );
}
