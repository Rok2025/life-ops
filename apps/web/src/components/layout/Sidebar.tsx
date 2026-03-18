'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home, Dumbbell, Sprout, Languages, BookOpen, Bot, Sparkles,
    PenLine, Users, Wallet, LogOut, Settings,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatHorizons } from '@/lib/horizons';
import { useAuth } from '@/contexts/AuthContext';
import NavLink from './NavLink';
import NavGroup from './NavGroup';
import ThemeToggle from './ThemeToggle';

interface NavChild {
    href: string;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    disabled?: boolean;
}

interface NavItem {
    href?: string;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    disabled?: boolean;
    children?: NavChild[];
}

const navItems: NavItem[] = [
    { href: '/', label: '主页', icon: Home },
    { href: '/fitness', label: '健身', icon: Dumbbell },
    {
        label: '成长',
        icon: Sprout,
        children: [
            { href: '/growth/english', label: '英语', icon: Languages },
            { href: '/growth/reading', label: '阅读', icon: BookOpen },
            { href: '/growth/ai', label: 'AI', icon: Bot },
            { href: '/growth/prompts', label: '提示词库', icon: Sparkles },
        ],
    },
    { href: '/output', label: '输出', icon: PenLine },
    { href: '/family', label: '家庭', icon: Users },
    { href: '/finance', label: '财务', icon: Wallet },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [horizons, setHorizons] = useState(formatHorizons());
    const [expandedGroups, setExpandedGroups] = useState<string[]>(['成长']);
    const { user, signOut, loading } = useAuth();

    useEffect(() => {
        const interval = setInterval(() => setHorizons(formatHorizons()), 60000);
        return () => clearInterval(interval);
    }, []);

    const toggleGroup = (label: string) => {
        setExpandedGroups(prev =>
            prev.includes(label) ? prev.filter(g => g !== label) : [...prev, label]
        );
    };

    if (!user && !loading && pathname === '/login') return null;

    return (
        <aside className="fixed left-0 top-0 h-screen w-(--sidebar-width) bg-sidebar-bg border-r border-glass-border backdrop-blur-2xl flex flex-col">
            {/* Logo */}
            <div className="p-4 border-b border-glass-border">
                <Link href="/" className="hover:opacity-80 transition-opacity">
                    <h1 className="text-h2 text-text-primary">Life OPS</h1>
                </Link>
                <p className="text-caption text-text-secondary mt-1">{horizons.week}</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-3">
                <div className="rounded-nav-container border border-glass-border/70 bg-panel-bg/40 p-1.5 shadow-[var(--shadow-xs)] backdrop-blur-xl">
                    <ul className="space-y-1">
                        {navItems.map((item) => {
                            if (item.children) {
                                const hasActiveChild = item.children.some(c => pathname.startsWith(c.href));
                                return (
                                    <NavGroup
                                        key={item.label}
                                        label={item.label}
                                        icon={item.icon}
                                        isExpanded={expandedGroups.includes(item.label)}
                                        hasActiveChild={hasActiveChild}
                                        pathname={pathname}
                                        onToggle={() => toggleGroup(item.label)}
                                    >
                                        {item.children}
                                    </NavGroup>
                                );
                            }

                            const href = item.href!;
                            const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
                            return (
                                <li key={href}>
                                    <NavLink
                                        href={href}
                                        label={item.label}
                                        icon={item.icon}
                                        isActive={isActive}
                                        disabled={item.disabled}
                                    />
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </nav>

            {/* Bottom Section */}
            <div className="mt-auto p-3 border-t border-glass-border bg-sidebar-bg/80 backdrop-blur-xl">
                {user ? (
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center shrink-0 shadow-sm shadow-accent/25">
                                    <span className="text-body-sm font-bold uppercase">{user.email?.charAt(0)}</span>
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-body-sm font-semibold text-text-primary truncate leading-tight">
                                        {user.email?.split('@')[0]}
                                    </span>
                                    <span className="text-caption text-text-tertiary truncate opacity-70">
                                        {user.email}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => signOut()}
                                className="p-2 text-text-tertiary hover:text-danger hover:bg-panel-bg rounded-card transition-all"
                                title="退出登录"
                            >
                                <LogOut size={18} />
                            </button>
                            <Link
                                href="/settings"
                                className="p-2 text-text-tertiary hover:text-accent hover:bg-panel-bg rounded-card transition-all"
                                title="系统配置"
                            >
                                <Settings size={18} />
                            </Link>
                        </div>
                        <ThemeToggle />
                    </div>
                ) : (
                    <ThemeToggle />
                )}
            </div>
        </aside>
    );
}
