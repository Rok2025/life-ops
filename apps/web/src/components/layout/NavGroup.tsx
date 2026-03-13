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
        <li>
            <button
                onClick={onToggle}
                className={`relative w-full flex items-center justify-between overflow-hidden px-4 py-2.5 rounded-card border transition-all duration-200 group ${hasActiveChild
                    ? 'border-selection-border/80 bg-selection-bg/85 text-selection-text shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm before:pointer-events-none before:absolute before:left-2 before:top-1/2 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-accent/80'
                    : 'border-transparent bg-transparent text-text-secondary hover:border-glass-border hover:bg-panel-bg/90 hover:text-text-primary'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <Icon
                        size={20}
                        className={hasActiveChild ? 'text-accent' : 'text-text-tertiary group-hover:text-text-primary'}
                    />
                    <span className="font-medium text-body-sm">{label}</span>
                </div>
                <ChevronDown
                    size={16}
                    className={`text-text-tertiary transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                />
            </button>
            <ul className={`overflow-hidden transition-all duration-200 space-y-2 ${isExpanded ? 'max-h-48 mt-2' : 'max-h-0'}`}>
                {children.map((child) => {
                    const isActive = pathname === child.href || pathname.startsWith(child.href);
                    return (
                        <li key={child.href}>
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
