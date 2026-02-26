
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white dark:bg-background-dark border border-slate-200 dark:border-border-muted w-full max-w-lg rounded-xl shadow-2xl overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-200 dark:border-border-muted flex items-center justify-between bg-slate-50 dark:bg-zinc-900/50">
          <h3 className="text-lg font-bold tracking-tight uppercase text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="text-slate-900 dark:text-white">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
