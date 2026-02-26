
import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="relative flex items-center justify-between w-14 h-7 p-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary overflow-hidden group"
            aria-label="Toggle Theme"
        >
            {/* Track Background highlights */}
            <div className={`absolute inset-0 transition-opacity duration-300 ${theme === 'light' ? 'bg-orange-100 opacity-20' : 'bg-blue-900 opacity-20'}`}></div>

            {/* Sliding Circle */}
            <div
                className={`relative z-10 w-5 h-5 rounded-full bg-white dark:bg-slate-200 shadow-md transform transition-transform duration-300 flex items-center justify-center ${theme === 'dark' ? 'translate-x-7' : 'translate-x-0'}`}
            >
                <span className={`material-symbols-outlined text-[14px] ${theme === 'light' ? 'text-orange-500' : 'text-slate-800'}`}>
                    {theme === 'light' ? 'light_mode' : 'dark_mode'}
                </span>
            </div>

            {/* Decorative Icons in background */}
            <div className="absolute inset-0 flex items-center justify-between px-1.5 pointer-events-none">
                <span className={`material-symbols-outlined text-[12px] transition-opacity duration-200 ${theme === 'dark' ? 'opacity-100 text-slate-400' : 'opacity-0'}`}>
                    light_mode
                </span>
                <span className={`material-symbols-outlined text-[12px] transition-opacity duration-200 ${theme === 'light' ? 'opacity-100 text-slate-400' : 'opacity-0'}`}>
                    dark_mode
                </span>
            </div>
        </button>
    );
};

export default ThemeToggle;
