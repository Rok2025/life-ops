'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, BookHeart, Trophy, Ruler, Heart, Clock,
} from 'lucide-react';

const NAV_ITEMS = [
    { href: '/growth/youyou', label: '总览', icon: LayoutDashboard },
    { href: '/growth/youyou/diary', label: '日记', icon: BookHeart },
    { href: '/growth/youyou/milestones', label: '里程碑', icon: Trophy },
    { href: '/growth/youyou/growth', label: '发育', icon: Ruler },
    { href: '/growth/youyou/health', label: '健康', icon: Heart },
    { href: '/growth/youyou/timeline', label: '时间线', icon: Clock },
];

export function YouyouSubNav() {
    const raw = usePathname();
    const pathname = raw.replace(/\/+$/, ''); // strip trailing slash

    return (
        <nav className="flex items-center gap-1 rounded-control border border-glass-border bg-bg-tertiary/88 p-0.5 shadow-sm backdrop-blur-xl mb-4 xl:mb-5 overflow-x-auto">
            {NAV_ITEMS.map(item => {
                const Icon = item.icon;
                const isActive = item.href === '/growth/youyou'
                    ? pathname === '/growth/youyou'
                    : pathname.startsWith(item.href);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={[
                            'inline-flex items-center justify-center gap-1.5 rounded-control px-3 py-1.5 text-body-sm font-medium transition-colors duration-normal ease-standard whitespace-nowrap',
                            isActive
                                ? 'bg-accent/15 text-accent shadow-sm border border-accent/25'
                                : 'text-text-tertiary hover:bg-card-bg/72 hover:text-text-secondary border border-transparent',
                        ].join(' ')}
                    >
                        <Icon size={14} className="shrink-0" />
                        <span>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
