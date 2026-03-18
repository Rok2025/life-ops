'use client';

import { ChevronDown } from 'lucide-react';
import NavLink from './NavLink';

interface NavChild {
    href: string;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    disabled?: boolean;
}

interface NavGroupProps {
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    children: NavChild[];
    isExpanded: boolean;
    hasActiveChild: boolean;
    pathname: string;
    onToggle: () => void;
}

export default function NavGroup({
    label, icon: Icon, children, isExpanded, hasActiveChild, pathname, onToggle,
}: NavGroupProps) {
    return (
        <li className="space-y-1">
            <button
                onClick={onToggle}
                aria-expanded={isExpanded}
                className={`group relative flex w-full items-center justify-between overflow-hidden rounded-nav-item border px-3.5 py-2.5 transition-all duration-200 ease-standard ${hasActiveChild
                    ? 'border-selection-border/90 bg-selection-bg text-selection-text shadow-glass-active backdrop-blur-sm'
                    : 'border-glass-border/45 bg-panel-bg/42 text-text-secondary shadow-glass-idle hover:border-glass-border/85 hover:bg-panel-bg/82 hover:text-text-primary'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <Icon
                        size={19}
                        className={hasActiveChild ? 'text-accent' : 'text-text-tertiary group-hover:text-text-primary'}
                    />
                    <span className="font-medium text-body-sm">{label}</span>
                </div>
                <ChevronDown
                    size={15}
                    className={`text-text-tertiary transition-transform duration-200 ease-standard ${isExpanded ? 'rotate-180' : ''}`}
                />
            </button>
            <ul className={`overflow-hidden transition-[max-height,opacity,margin] duration-200 ease-standard ${isExpanded ? 'mt-1 max-h-56 opacity-100' : 'max-h-0 opacity-0'}`}>
                {children.map((child) => {
                    const isActive = pathname === child.href || pathname.startsWith(child.href);
                    return (
                        <li key={child.href} className="mt-1 first:mt-0">
                            <NavLink
                                href={child.href}
                                label={child.label}
                                icon={child.icon}
                                isActive={isActive}
                                isChild
                                disabled={child.disabled}
                            />
                        </li>
                    );
                })}
            </ul>
        </li>
    );
}
