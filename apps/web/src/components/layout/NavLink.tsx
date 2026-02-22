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
            <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border/30 bg-bg-tertiary/20 text-text-tertiary cursor-not-allowed opacity-50 ${isChild ? 'ml-6' : ''}`}>
                <Icon size={isChild ? 16 : 20} />
                <span className="font-medium text-sm">{label}</span>
            </div>
        );
    }

    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-200 group ${isChild ? 'ml-6' : ''} ${isActive
                ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20'
                : 'border-border bg-bg-tertiary/30 text-text-secondary hover:border-accent hover:bg-accent/10 hover:text-text-primary'
                }`}
        >
            <Icon
                size={isChild ? 16 : 20}
                className={isActive ? 'text-white' : 'text-text-tertiary group-hover:text-accent'}
            />
            <span className="font-medium text-sm">{label}</span>
        </Link>
    );
}
