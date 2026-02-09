import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; // Added useNavigate
import { useAuth } from '../context/AuthContext'; // Value added
import { Role } from '../types/auth';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, hasRole, logout } = useAuth(); // Use auth context
  const [isHovered, setIsHovered] = React.useState(false);

  // Determine if sidebar is in "expanded" mode (visual width = 64)
  // Expanded if: Mobile Open OR Desktop Hovered
  const isExpanded = isOpen || isHovered;

  const navItems = [
    { path: "/dashboard", icon: "dashboard", label: "Dashboard", menu: "Main Menu", roles: [] as Role[] }, // Empty roles = all
    { path: "/sites", icon: "storefront", label: "Sites", menu: "Main Menu", roles: ['ADMIN', 'MANAGER', 'STAFF'] as Role[] },
    { path: "/hubs", icon: "router", label: "Hubs", menu: "Main Menu", roles: ['ADMIN', 'MANAGER', 'STAFF'] as Role[] },
    { path: "/sensors", icon: "sensors", label: "Sensors", menu: "Main Menu", roles: ['ADMIN', 'MANAGER', 'STAFF'] as Role[] },
    { path: "/alerts", icon: "notifications", label: "Alerts", menu: "Main Menu", roles: ['ADMIN', 'MANAGER', 'STAFF'] as Role[] },
    { path: "/organizations", icon: "domain", label: "Organizations", menu: "Administration", roles: ['ADMIN'] as Role[] },
    { path: "/users", icon: "manage_accounts", label: "Users", menu: "Administration", roles: ['ADMIN'] as Role[] },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const checkPermission = (itemRoles: Role[]) => {
    if (itemRoles.length === 0) return true; // Public/All
    return hasRole(itemRoles);
  };

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
      fixed inset-y-0 left-0 z-50 border-r border-border-muted flex flex-col h-screen bg-background-light dark:bg-background-dark transition-all duration-300 ease-in-out
      md:translate-x-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      ${isExpanded ? 'w-64 shadow-2xl' : 'w-20'}
    `}>
      <div className={`p-6 flex items-center ${isExpanded ? 'justify-between' : 'justify-center'}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center min-w-[2rem]">
            <span className="material-symbols-outlined text-white text-xl font-bold">dataset</span>
          </div>
          {isExpanded && (
            <div className="transition-opacity duration-300 animate-in fade-in">
              <h1 className="text-sm font-bold tracking-tight uppercase leading-none">Smart Store</h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-tighter">ENVIRONMENTAL</p>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        <button onClick={onClose} className={`md:hidden text-slate-400 hover:text-white ${!isOpen && 'hidden'}`}>
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <nav className="flex-1 mt-4 overflow-y-auto overflow-x-hidden">
        {isExpanded && <div className="px-4 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap transition-opacity duration-300">Main Menu</div>}

        {navItems.filter(item => item.menu === "Main Menu" && checkPermission(item.roles)).map(item => (
          <Link
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={`flex items-center gap-3 px-6 py-3 transition-all ${isActive(item.path) ? 'sidebar-item-active' : 'sidebar-item-inactive'} ${!isExpanded ? 'justify-center' : ''}`}
            title={!isExpanded ? item.label : ''}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            {isExpanded && <span className="text-sm font-medium whitespace-nowrap transition-opacity duration-300 animate-in fade-in">{item.label}</span>}
          </Link>
        ))}

        {navItems.some(item => item.menu === "Administration" && checkPermission(item.roles)) && (
          <>
            {isExpanded && <div className="px-4 mt-8 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap transition-opacity duration-300">Administration</div>}
            {navItems.filter(item => item.menu === "Administration" && checkPermission(item.roles)).map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-6 py-3 transition-all ${isActive(item.path) ? 'sidebar-item-active' : 'sidebar-item-inactive'} ${!isExpanded ? 'justify-center' : ''}`}
                title={!isExpanded ? item.label : ''}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                {isExpanded && <span className="text-sm font-medium whitespace-nowrap transition-opacity duration-300 animate-in fade-in">{item.label}</span>}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-border-muted relative overflow-hidden">
        {isExpanded && (
          <div className="px-4 py-2 mb-2 whitespace-nowrap transition-opacity duration-300 animate-in fade-in">
            <p className="text-xs text-slate-500">Logged in as:</p>
            <p className="text-sm font-bold truncate">{user?.email}</p>
            <p className="text-[10px] uppercase font-bold text-primary">{user?.role}</p>
          </div>
        )}

        <button onClick={handleLogout} className={`flex w-full items-center gap-3 px-4 py-2 text-slate-500 hover:text-red-500 transition-colors ${!isExpanded ? 'justify-center' : ''}`} title="Logout">
          <span className="material-symbols-outlined">logout</span>
          {isExpanded && <span className="text-sm font-medium whitespace-nowrap transition-opacity duration-300 animate-in fade-in">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
