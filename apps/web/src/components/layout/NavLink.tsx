'use client';

import Link from 'next/link';

interface NavLinkProps {
    href: string;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    isActive: boolean;
    isChild?: boolean;
    disabled?: boolean;
}

export default function NavLink({ href, label, icon: Icon, isActive, isChild = false, disabled = false }: NavLinkProps) {
    const spacingClass = isChild ? 'pl-10 pr-3 py-2.5 rounded-inner-card' : 'px-3.5 py-2.5 rounded-nav-item';
    const childIndicatorClass = isChild
        ? isActive
            ? 'before:pointer-events-none before:absolute before:left-4 before:top-1/2 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full before:bg-accent'
            : 'before:pointer-events-none before:absolute before:left-4 before:top-1/2 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full before:bg-glass-border'
        : '';

    if (disabled) {
        return (
            <div className={`relative flex items-center gap-3 border border-glass-border/60 bg-panel-bg/55 text-text-tertiary opacity-50 shadow-glass-idle backdrop-blur-sm ${spacingClass} ${childIndicatorClass} cursor-not-allowed`}>
                <Icon size={isChild ? 16 : 20} />
                <span className="font-medium text-body-sm">{label}</span>
            </div>
        );
    }

    return (
        <Link
            href={href}
            className={`group relative flex items-center gap-3 overflow-hidden border transition-all duration-200 ease-standard ${spacingClass} ${childIndicatorClass} ${isActive
                ? 'border-selection-border/90 bg-selection-bg text-selection-text shadow-glass-active backdrop-blur-sm'
                : 'border-glass-border/45 bg-panel-bg/42 text-text-secondary shadow-glass-idle hover:border-glass-border/85 hover:bg-panel-bg/82 hover:text-text-primary'
                }`}
        >
            <Icon
                size={isChild ? 16 : 19}
                className={isActive ? 'text-accent' : 'text-text-tertiary group-hover:text-text-primary'}
            />
            <span className="font-medium text-body-sm">{label}</span>
        </Link>
    );
}
