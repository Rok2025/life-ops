'use client';

import { usePathname } from 'next/navigation';
import { Dumbbell, Wallet, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import NavLink from './NavLink';
import { getAppShellPanelClassName } from './appShellLayout';

const navItems = [
    { href: '/fitness', label: '健身', icon: Dumbbell },
    { href: '/finance', label: '财务', icon: Wallet },
];

type SidebarProps = {
    visible?: boolean;
};

export default function Sidebar({ visible = true }: SidebarProps) {
    const pathname = usePathname();
    const { user, signOut, loading } = useAuth();

    if (!visible || (!user && !loading && pathname === '/login')) return null;

    return (
        <aside className={getAppShellPanelClassName('left')}>
            {/* Navigation */}
            <nav aria-label="业务导航" className="flex-1 overflow-y-auto px-3 py-3">
                <div className="rounded-nav-container border border-glass-border/70 bg-panel-bg/40 p-1.5 shadow-glass-idle backdrop-blur-xl">
                    <ul className="space-y-1">
                        {navItems.map((item) => {
                            const href = item.href;
                            const isActive = pathname === href || pathname.startsWith(`${href}/`);
                            return (
                                <li key={href}>
                                    <NavLink
                                        href={href}
                                        label={item.label}
                                        icon={item.icon}
                                        isActive={isActive}
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
                        </div>
                    </div>
                ) : null}
            </div>
        </aside>
    );
}
