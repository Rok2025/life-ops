'use client';

import { Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ThemeToggle() {
    const [isDarkMode, setIsDarkMode] = useState(true);

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

    return (
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
    );
}
