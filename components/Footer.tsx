
import React from 'react';

const Footer: React.FC = () => (
  <footer className="mt-12 pt-8 border-t border-border-muted flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 pb-8">
    <p className="text-[10px] font-bold uppercase tracking-widest">© 2026 IoT Smart Environmental Monitor v2.4.0</p>
    <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest">
      <a className="hover:text-white transition-colors" href="#">Privacy Policy</a>
      <a className="hover:text-white transition-colors" href="#">Support Center</a>
      <a className="hover:text-white transition-colors" href="#">System Health</a>
    </div>
  </footer>
);

export default Footer;
