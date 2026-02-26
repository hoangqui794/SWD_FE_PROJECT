
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  breadcrumb: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title, breadcrumb }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-white relative transition-colors duration-300">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content - Added md:pl-20 to reserve space for collapsed sidebar */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-20 transition-all duration-300">
        <Header title={title} breadcrumb={breadcrumb} onMenuClick={toggleSidebar} />
        <main className="p-4 md:p-8 overflow-y-auto w-full flex-1">
          {children}
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default Layout;
