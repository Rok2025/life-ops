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
    if (disabled) {
        return (
            <div className={`flex items-center gap-3 px-4 py-2.5 rounded-card border border-glass-border bg-panel-bg text-text-tertiary cursor-not-allowed opacity-50 backdrop-blur-sm ${isChild ? 'ml-6' : ''}`}>
                <Icon size={isChild ? 16 : 20} />
                <span className="font-medium text-body-sm">{label}</span>
            </div>
        );
    }

    return (
        <Link
            href={href}
            className={`relative flex items-center gap-3 overflow-hidden px-4 py-2.5 rounded-card border transition-all duration-200 group ${isChild ? 'ml-6' : ''} ${isActive
                ? 'border-selection-border/80 bg-selection-bg/85 text-selection-text shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm before:pointer-events-none before:absolute before:left-2 before:top-1/2 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-accent/80'
                : 'border-transparent bg-transparent text-text-secondary hover:border-glass-border hover:bg-panel-bg/90 hover:text-text-primary'
                }`}
        >
            <Icon
                size={isChild ? 16 : 20}
                className={isActive ? 'text-accent' : 'text-text-tertiary group-hover:text-text-primary'}
            />
            <span className="font-medium text-body-sm">{label}</span>
        </Link>
    );
}
