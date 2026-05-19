'use client';

import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Card } from './Card';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  bodyClassName?: string;
  headerActions?: ReactNode;
  titleId?: string;
}

const sizeClass: Record<NonNullable<DrawerProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export function Drawer({
  open,
  onClose,
  title,
  children,
  size = 'md',
  className,
  bodyClassName,
  headerActions,
  titleId,
}: DrawerProps) {
  const previousBodyOverflowRef = useRef<string | null>(null);
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    previousBodyOverflowRef.current = document.body.style.overflow;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousBodyOverflowRef.current ?? '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;
  if (typeof document === 'undefined') return null;

  const panelId = titleId ?? 'drawer-title';
  const drawerNode = (
    <div
      className="fixed inset-0 z-[60] flex justify-end"
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
        className={`relative flex h-full w-full ${sizeClass[size]} ${className ?? ''}`.trim()}
        onClick={(event) => event.stopPropagation()}
      >
        <Card className="flex h-full w-full flex-col overflow-hidden rounded-none border-y-0 border-r-0 p-0 shadow-lg">
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

  return createPortal(drawerNode, document.body);
}
