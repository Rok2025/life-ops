'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    Dumbbell,
    Sun,
    Moon,
    LogOut,
    Sprout,
    Languages,
    BookOpen,
    Bot,
    PenLine,
    Users,
    Wallet,
    ChevronDown
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatHorizons } from '@/lib/horizons';
import Logo from './Logo';
import { useAuth } from '@/contexts/AuthContext';

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
        ]
    },
    { href: '/output', label: '输出', icon: PenLine },
    { href: '/family', label: '家庭', icon: Users },
    { href: '/finance', label: '财务', icon: Wallet },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [horizons, setHorizons] = useState(formatHorizons());
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [expandedGroups, setExpandedGroups] = useState<string[]>(['成长']);
    const { user, signOut, loading } = useAuth();

    useEffect(() => {
        const interval = setInterval(() => {
            setHorizons(formatHorizons());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkMode(dark);
        if (dark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.add('light');
        }
    }, []);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
        document.documentElement.classList.toggle('dark');
        document.documentElement.classList.toggle('light');
    };

    const toggleGroup = (label: string) => {
        setExpandedGroups(prev =>
            prev.includes(label)
                ? prev.filter(g => g !== label)
                : [...prev, label]
        );
    };

    // 检查是否在某个分组的子路由中
    const isInGroup = (children: NavChild[]) => {
        return children.some(child => pathname.startsWith(child.href));
    };

    // 如果未登录，侧边栏可能需要隐藏或显示简单状态
    if (!user && !loading && pathname === '/login') return null;

    // 渲染单个导航项（无子菜单）
    const renderNavLink = (item: NavItem | NavChild, isChild = false) => {
        const Icon = item.icon;
        const href = item.href!;
        const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

        if (item.disabled) {
            return (
                <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border/30 bg-bg-tertiary/20 text-text-tertiary cursor-not-allowed opacity-50 ${isChild ? 'ml-6' : ''}`}>
                    <Icon size={isChild ? 16 : 20} />
                    <span className="font-medium text-sm">{item.label}</span>
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
                <span className="font-medium text-sm">{item.label}</span>
            </Link>
        );
    };

    return (
        <aside className="fixed left-0 top-0 h-screen w-[var(--sidebar-width)] bg-bg-secondary border-r border-border flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-border">
                <Link href="/" className="hover:opacity-80 transition-opacity">
                    <h1 className="text-xl font-semibold text-text-primary">Life OPS</h1>
                </Link>
                <p className="text-sm text-text-secondary mt-1">{horizons.week}</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 overflow-y-auto">
                <ul className="space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;

                        // 带子菜单的分组项
                        if (item.children) {
                            const isExpanded = expandedGroups.includes(item.label);
                            const hasActiveChild = isInGroup(item.children);

                            return (
                                <li key={item.label}>
                                    <button
                                        onClick={() => toggleGroup(item.label)}
                                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all duration-200 group ${hasActiveChild
                                            ? 'text-accent bg-accent/10 border-accent/50'
                                            : 'border-border bg-bg-tertiary/30 text-text-secondary hover:border-accent hover:bg-accent/10 hover:text-text-primary'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon
                                                size={20}
                                                className={hasActiveChild ? 'text-accent' : 'text-text-tertiary group-hover:text-text-primary'}
                                            />
                                            <span className="font-medium text-sm">{item.label}</span>
                                        </div>
                                        <ChevronDown
                                            size={16}
                                            className={`text-text-tertiary transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                        />
                                    </button>
                                    {/* 子菜单 */}
                                    <ul className={`overflow-hidden transition-all duration-200 space-y-2 ${isExpanded ? 'max-h-48 mt-2' : 'max-h-0'}`}>
                                        {item.children.map((child) => (
                                            <li key={child.href}>
                                                {renderNavLink(child, true)}
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            );
                        }

                        // 普通导航项
                        return (
                            <li key={item.href}>
                                {renderNavLink(item)}
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Bottom Section: User & Theme */}
            <div className="mt-auto p-4 border-t border-border bg-bg-secondary/40 backdrop-blur-md">
                {user ? (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <span className="text-sm font-bold uppercase">{user.email?.charAt(0)}</span>
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-sm font-semibold text-text-primary truncate leading-tight">
                                        {user.email?.split('@')[0]}
                                    </span>
                                    <span className="text-[10px] text-text-tertiary truncate opacity-70">
                                        {user.email}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => signOut()}
                                className="p-2 text-text-tertiary hover:text-danger hover:bg-danger/10 rounded-xl transition-all"
                                title="退出登录"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2 text-text-secondary">
                                {isDarkMode ? <Moon size={14} className="text-accent" /> : <Sun size={14} className="text-warning" />}
                                <span className="text-[10px] font-bold uppercase tracking-tighter opacity-50">
                                    {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                                </span>
                            </div>
                            <button
                                onClick={toggleTheme}
                                className="relative w-9 h-5 rounded-full bg-bg-tertiary transition-colors hover:bg-bg-tertiary/80 border border-border"
                            >
                                <div className={`absolute top-[2px] left-[2px] w-3.5 h-3.5 rounded-full shadow-sm transition-all duration-300 ${isDarkMode ? 'translate-x-4 bg-accent' : 'translate-x-0 bg-white'}`} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-medium text-text-tertiary">Theme</span>
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-text-tertiary hover:text-text-primary transition-colors"
                        >
                            {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
