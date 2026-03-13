'use client';

import { useCallback, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Card } from './Card';

export interface DialogProps {
  /** When false, render nothing */
  open: boolean;
  onClose: () => void;
  /** Optional title in the header */
  title?: ReactNode;
  /** Panel max width (default: max-w-2xl) */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Panel content; header (title + close) is always rendered when title is set */
  children: ReactNode;
  /** Optional class for the panel Card */
  className?: string;
  /** Optional class for the scroll/body wrapper */
  bodyClassName?: string;
  /** Optional actions rendered in the header before the close button */
  headerActions?: ReactNode;
  /** Optional id for the title element (for aria-labelledby) */
  titleId?: string;
}

const maxWidthClass: Record<NonNullable<DialogProps['maxWidth']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export function Dialog({
  open,
  onClose,
  title,
  maxWidth = '2xl',
  children,
  className,
  bodyClassName,
  headerActions,
  titleId,
}: DialogProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
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
  if (typeof document === 'undefined') return null;

  const panelId = titleId ?? 'dialog-title';
  const dialogNode = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title != null ? panelId : undefined}
    >
      <div
        className="absolute inset-0 bg-black/35 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`relative mx-4 flex max-h-[calc(100vh-2rem)] w-full flex-col ${maxWidthClass[maxWidth]} ${className ?? ''}`.trim()}
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="flex h-full max-h-[calc(100vh-2rem)] flex-col overflow-hidden p-0 shadow-lg">
        {title != null && (
          <div className="flex shrink-0 items-center justify-between border-b border-glass-border px-5 py-3">
            <h2 id={panelId} className="text-h3 text-text-primary">
              {title}
            </h2>
            <div className="flex items-center gap-2">
              {headerActions}
              <button
                type="button"
                onClick={onClose}
                className="rounded-control p-1.5 text-text-secondary transition-colors duration-normal ease-standard hover:bg-bg-tertiary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                aria-label="关闭"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}
        <div className={bodyClassName ?? 'min-h-0 flex-1 overflow-y-auto'}>{children}</div>
        </Card>
      </div>
    </div>
  );

  return createPortal(dialogNode, document.body);
}
