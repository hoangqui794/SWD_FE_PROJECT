
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/90 backdrop-blur-md transition-all duration-300 animate-in fade-in">
      <div className="bg-white dark:bg-background-dark border border-slate-200 dark:border-zinc-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden transition-all duration-500 scale-100 animate-in zoom-in-95">
        <div className="px-8 py-6 border-b border-slate-100 dark:border-zinc-800/50 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02] backdrop-blur-sm">
          <h3 className="text-xs font-black tracking-[0.2em] uppercase text-slate-400 dark:text-zinc-500">{title}</h3>
          <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="text-slate-900 dark:text-white relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
