'use client';

import { createPortal } from 'react-dom';
import { Check, ChevronUp, Moon, Palette, Sparkles, Sun } from 'lucide-react';
import type { ComponentType, CSSProperties } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    THEME_OPTIONS,
    type ThemeName,
    applyTheme,
    persistTheme,
    resolveInitialTheme,
} from '@/lib/theme';

const THEME_ICONS: Record<ThemeName, ComponentType<{ size?: number; className?: string }>> = {
    light: Sun,
    dark: Moon,
    dracula: Sparkles,
};

function getThemeIconClass(theme: ThemeName) {
    if (theme === 'light') return 'text-warning';
    if (theme === 'dracula') return 'text-tone-purple';
    return 'text-accent';
}

export default function ThemeToggle() {
    const [theme, setTheme] = useState<ThemeName>(() => resolveInitialTheme());
    const [isOpen, setIsOpen] = useState(false);
    const [popoverStyle, setPopoverStyle] = useState<CSSProperties | null>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    const updatePopoverPosition = useCallback(() => {
        const trigger = triggerRef.current;
        if (!trigger || typeof window === 'undefined') return;

        const rect = trigger.getBoundingClientRect();
        const width = Math.min(292, window.innerWidth - 24);
        const preferredLeft = rect.right + 12;
        const maxLeft = window.innerWidth - width - 12;
        const left = Math.max(12, Math.min(preferredLeft, maxLeft));
        const bottom = Math.max(12, window.innerHeight - rect.bottom);

        setPopoverStyle({
            left,
            bottom,
            width,
        });
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const handlePointerDown = (event: MouseEvent) => {
            const target = event.target as Node;
            if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) {
                return;
            }

            setIsOpen(false);
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        const handleViewportChange = () => {
            updatePopoverPosition();
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        window.addEventListener('resize', handleViewportChange);
        window.addEventListener('scroll', handleViewportChange, true);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', handleViewportChange);
            window.removeEventListener('scroll', handleViewportChange, true);
        };
    }, [isOpen, updatePopoverPosition]);

    const handleThemeChange = (nextTheme: ThemeName) => {
        setTheme(nextTheme);
        persistTheme(nextTheme);
        setIsOpen(false);
    };

    const handleToggle = () => {
        if (isOpen) {
            setIsOpen(false);
            return;
        }

        updatePopoverPosition();
        setIsOpen(true);
    };

    const activeTheme = THEME_OPTIONS.find((option) => option.id === theme) ?? THEME_OPTIONS[0];
    const ActiveIcon = THEME_ICONS[activeTheme.id];
    const popover =
        isOpen && popoverStyle && typeof document !== 'undefined'
            ? createPortal(
                  <div
                      ref={popoverRef}
                      role="menu"
                      aria-label="主题选择"
                      className="glass-popover fixed z-[70] max-h-[min(26rem,calc(100vh-1.5rem))] overflow-y-auto rounded-popover border border-glass-border/90 p-2 shadow-[var(--shadow-lg)]"
                      style={popoverStyle}
                  >
                      <div className="mb-1 flex items-center justify-between gap-3 px-2 py-1.5">
                          <div>
                              <div className="text-caption font-medium text-text-tertiary">主题</div>
                              <div className="text-body-sm font-medium text-text-primary">
                                  选择界面外观
                              </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                              {activeTheme.swatches.map((swatch) => (
                                  <span
                                      key={swatch}
                                      className="h-2.5 w-2.5 rounded-full border border-white/12 shadow-sm"
                                      style={{ backgroundColor: swatch }}
                                      aria-hidden="true"
                                  />
                              ))}
                          </div>
                      </div>

                      <div className="space-y-1">
                          {THEME_OPTIONS.map((option) => {
                              const Icon = THEME_ICONS[option.id];
                              const isActive = theme === option.id;

                              return (
                                  <button
                                      key={option.id}
                                      type="button"
                                      role="menuitemradio"
                                      aria-checked={isActive}
                                      onClick={() => handleThemeChange(option.id)}
                                      className={`glass-list-row flex w-full items-center gap-3 px-3 py-2.5 text-left ${
                                          isActive
                                              ? 'border-selection-border bg-selection-bg shadow-[var(--shadow-sm)]'
                                              : 'hover:bg-bg-secondary/85'
                                      }`}
                                      >
                                          <div
                                              className={`glass-icon-badge h-9 w-9 shrink-0 ${
                                                  option.id === 'dracula' ? 'bg-tone-purple/12' : ''
                                              }`}
                                          >
                                              <Icon size={16} className={getThemeIconClass(option.id)} />
                                          </div>
                                      <div className="min-w-0 flex-1">
                                          <div className="text-body-sm font-medium text-text-primary">
                                              {option.label}
                                          </div>
                                          <div className="truncate text-caption text-text-tertiary">
                                              {option.description}
                                          </div>
                                      </div>
                                      <div className="flex shrink-0 items-center gap-1">
                                          {option.swatches.map((swatch) => (
                                              <span
                                                  key={swatch}
                                                  className="h-2.5 w-2.5 rounded-full border border-white/12 shadow-sm"
                                                  style={{ backgroundColor: swatch }}
                                                  aria-hidden="true"
                                              />
                                          ))}
                                      </div>
                                      <span
                                          className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-normal ease-standard ${
                                              isActive
                                                  ? 'border-accent/35 bg-accent/12 text-accent'
                                                  : 'border-glass-border text-transparent'
                                          }`}
                                          aria-hidden="true"
                                      >
                                          <Check size={12} />
                                      </span>
                                  </button>
                              );
                          })}
                      </div>
                  </div>,
                  document.body
              )
            : null;

    return (
        <div className="px-1">
            <button
                ref={triggerRef}
                type="button"
                onClick={handleToggle}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                className="glass-list-row flex w-full items-center gap-3 rounded-popover px-3 py-2.5 text-left shadow-[var(--shadow-sm)]"
            >
                <div className="glass-icon-badge h-8 w-8 shrink-0">
                    <Palette size={15} className="text-accent" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-body-sm font-medium text-text-primary">主题</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-caption text-text-tertiary">
                        <ActiveIcon size={13} className={`${getThemeIconClass(activeTheme.id)} shrink-0`} />
                        <span className="truncate">{activeTheme.label}</span>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                    {activeTheme.swatches.map((swatch) => (
                        <span
                            key={swatch}
                            className="h-2.5 w-2.5 rounded-full border border-white/12 shadow-sm"
                            style={{ backgroundColor: swatch }}
                            aria-hidden="true"
                        />
                    ))}
                </div>
                <ChevronUp
                    size={15}
                    className={`shrink-0 text-text-tertiary transition-transform duration-normal ease-standard ${
                        isOpen ? '' : 'rotate-180'
                    }`}
                />
            </button>
            {popover}
        </div>
    );
}
