'use client';

import Link from 'next/link';
import { memo, type ComponentType } from 'react';

interface NavLinkProps {
    href: string;
    label: string;
    icon: ComponentType<{ size?: number; className?: string }>;
    isActive: boolean;
}

function NavLink({ href, label, icon: Icon, isActive }: NavLinkProps) {
    return (
        <Link
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={`group relative flex items-center gap-3 overflow-hidden rounded-nav-item border px-3.5 py-2.5 transition-all duration-200 ease-standard ${isActive
                ? 'border-selection-border/90 bg-selection-bg text-selection-text shadow-glass-active backdrop-blur-sm'
                : 'border-glass-border/45 bg-panel-bg/42 text-text-secondary shadow-glass-idle hover:border-glass-border/85 hover:bg-panel-bg/82 hover:text-text-primary'
                }`}
        >
            <Icon size={19} className={isActive ? 'text-accent' : 'text-text-tertiary group-hover:text-text-primary'} />
            <span className="font-medium text-body-sm">{label}</span>
        </Link>
    );
}

export default memo(NavLink);
