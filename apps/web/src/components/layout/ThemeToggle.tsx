'use client';

import { Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ThemeToggle() {
    const [isDarkMode, setIsDarkMode] = useState(true);

    useEffect(() => {
        const m = window.matchMedia('(prefers-color-scheme: dark)');
        queueMicrotask(() => {
            setIsDarkMode(m.matches);
            if (m.matches) document.documentElement.classList.add('dark');
            else document.documentElement.classList.add('light');
        });
        const onChange = (e: MediaQueryListEvent) => {
            setIsDarkMode(e.matches);
            if (e.matches) document.documentElement.classList.add('dark');
            else document.documentElement.classList.add('light');
        };
        m.addEventListener('change', onChange);
        return () => m.removeEventListener('change', onChange);
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDarkMode);
        document.documentElement.classList.toggle('light', !isDarkMode);
    }, [isDarkMode]);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
        document.documentElement.classList.toggle('dark');
        document.documentElement.classList.toggle('light');
    };

    return (
        <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-text-secondary">
                {isDarkMode ? <Moon size={14} className="text-accent" /> : <Sun size={14} className="text-warning" />}
                <span className="text-caption font-bold tracking-tight opacity-50">
                    {isDarkMode ? '深色模式' : '浅色模式'}
                </span>
            </div>
            <button
                onClick={toggleTheme}
                className={`relative h-6 w-10 rounded-full border transition-all duration-300 ${
                    isDarkMode
                        ? 'border-accent/25 bg-accent/90'
                        : 'border-glass-border bg-panel-bg backdrop-blur-xl hover:bg-card-bg'
                }`}
            >
                <div className={`absolute left-[4px] top-[4px] h-4 w-4 rounded-full border border-white/60 bg-white shadow-sm transition-all duration-300 ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
        </div>
    );
}
