
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  breadcrumb: string;
  onMenuClick?: () => void;
}

import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const Header: React.FC<HeaderProps> = ({ title, breadcrumb, onMenuClick }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // Access user info

  const performLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-border-muted flex items-center justify-between px-4 md:px-8 bg-white dark:bg-background-dark z-30 sticky top-0 transition-colors duration-300">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          aria-label="Open Menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="hidden md:block">
          <h2 className="text-sm font-medium text-slate-400">{breadcrumb} / <span className="text-slate-900 dark:text-white">{title}</span></h2>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <ThemeToggle />
        <div className="flex items-center gap-3 md:pr-6 md:border-r border-slate-200 dark:border-border-muted">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold leading-none text-slate-900 dark:text-white">{user?.name || 'User'}</p>
            <p className="text-[10px] text-primary font-medium mt-1">{user?.role || 'Guest'}</p>
          </div>
          <div
            className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-center bg-cover border border-slate-200 dark:border-border-muted shadow-sm"
            style={{ backgroundImage: `url('https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random')` }}
          ></div>
        </div>
        <button
          onClick={performLogout}
          className="text-slate-500 hover:text-red-500 dark:hover:text-white transition-colors flex items-center gap-1 group"
        >
          <span className="material-symbols-outlined text-xl group-hover:translate-x-0.5 transition-transform">logout</span>
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
