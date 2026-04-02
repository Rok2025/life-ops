'use client';

import { useEffect, useRef, useState } from 'react';

interface OverflowTooltipTextProps {
    text: string;
    className?: string;
    tooltipClassName?: string;
}

export function OverflowTooltipText({ text, className, tooltipClassName }: OverflowTooltipTextProps) {
    const textRef = useRef<HTMLDivElement | null>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);

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

    return (
        <div className="group relative min-w-0">
            <div ref={textRef} className={className}>
                {text}
            </div>

            {isOverflowing ? (
                <div
                    className={[
                        'pointer-events-none absolute left-0 top-full z-30 mt-1 w-max max-w-[min(32rem,calc(100vw-7rem))] rounded-popover border border-glass-border bg-panel-bg/96 px-3 py-2 text-body-sm text-text-primary opacity-0 shadow-lg shadow-black/8 transition-all duration-fast ease-standard invisible group-hover:visible group-hover:opacity-100',
                        tooltipClassName,
                    ].filter(Boolean).join(' ')}
                >
                    <div className="whitespace-normal wrap-break-word">{text}</div>
                </div>
            ) : null}
        </div>
    );
}