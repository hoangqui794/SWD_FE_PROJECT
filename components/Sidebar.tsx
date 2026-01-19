
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navItems = [
    { path: "/dashboard", icon: "dashboard", label: "Dashboard", menu: "Main Menu" },
    { path: "/sites", icon: "storefront", label: "Sites", menu: "Main Menu" },
    { path: "/hubs", icon: "router", label: "Hubs", menu: "Main Menu" },
    { path: "/sensors", icon: "sensors", label: "Sensors", menu: "Main Menu" },
    { path: "/alerts", icon: "notifications", label: "Alerts", menu: "Main Menu" },
    { path: "/users", icon: "manage_accounts", label: "Users", menu: "Administration" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-64 border-r border-border-muted flex flex-col h-screen bg-background-light dark:bg-background-dark transition-transform duration-300 ease-in-out
      md:translate-x-0 md:sticky md:top-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-xl font-bold">dataset</span>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight uppercase leading-none">Smart Store</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-tighter">ENVIRONMENTAL</p>
          </div>
        </div>
        <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <nav className="flex-1 mt-4 overflow-y-auto">
        <div className="px-4 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Main Menu</div>
        {navItems.filter(item => item.menu === "Main Menu").map(item => (
          <Link 
            key={item.path} 
            to={item.path} 
            onClick={onClose}
            className={`flex items-center gap-3 px-6 py-3 transition-all ${isActive(item.path) ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
        
        <div className="px-4 mt-8 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Administration</div>
        {navItems.filter(item => item.menu === "Administration").map(item => (
          <Link 
            key={item.path} 
            to={item.path} 
            onClick={onClose}
            className={`flex items-center gap-3 px-6 py-3 transition-all ${isActive(item.path) ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
      
      <div className="p-4 border-t border-border-muted">
        <Link to="/dashboard" onClick={onClose} className="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-white transition-colors">
          <span className="material-symbols-outlined">settings</span>
          <span className="text-sm font-medium">Settings</span>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
