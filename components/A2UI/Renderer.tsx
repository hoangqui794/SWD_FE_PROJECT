import React from 'react';
import { A2UIComponent } from '../../types/a2ui';

// Simple UI components to be mapped via the Registry
const A2UIText: React.FC<{ content: string; style?: 'title' | 'body' | 'caption' }> = ({ content, style = 'body' }) => {
    const styles = {
        title: "text-base md:text-lg font-bold text-slate-900 dark:text-white mb-1 tracking-tight",
        body: "text-slate-600 dark:text-slate-400 text-[11px] md:text-[13px] leading-relaxed",
        caption: "text-[8px] text-primary dark:text-primary uppercase tracking-[0.15em] font-bold mb-0.5 flex items-center gap-2"
    };

    if (style === 'caption') {
        return (
            <div className={styles[style]}>
                <span className="w-3 h-[1px] bg-primary"></span>
                {content}
            </div>
        );
    }

    return <p className={styles[style]}>{content}</p>;
};

const A2UIButton: React.FC<{ label: string; onClick?: () => void; color?: string }> = ({ label, onClick, color }) => (
    <button
        onClick={onClick}
        className={`group relative overflow-hidden px-5 py-2 mt-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all shadow-md active:scale-95 ${color || 'bg-primary text-white shadow-primary/10'
            }`}
    >
        <span className="relative z-10">{label}</span>
    </button>
);

const A2UIStatCard: React.FC<{ title: string; value: string; icon?: string; colorClass?: string }> = ({ title, value, icon, colorClass }) => (
    <div className="group relative p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-md flex flex-col justify-between h-28 hover:border-primary/50 transition-all duration-500 overflow-hidden shadow-sm">

        <div className="relative z-10 flex justify-between items-start">
            <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">{title}</p>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm ${colorClass}`}>
                {icon && <span className="material-symbols-outlined text-[18px]">{icon}</span>}
            </div>
        </div>

        <div className="relative z-10">
            <p className={`text-2xl font-bold text-slate-900 dark:text-white tracking-tighter`}>{value}</p>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-slate-100 dark:bg-white/5">
            <div className={`h-full w-0 group-hover:w-full transition-all duration-700 ${colorClass?.replace('text-', 'bg-') || 'bg-primary'}`}></div>
        </div>
    </div>
);

// Registry maps types to components
export const A2UIRegistry: Record<string, React.FC<any>> = {
    'text': A2UIText,
    'button': A2UIButton,
    'stat-card': A2UIStatCard,
    'container': ({ children }: { children: React.ReactNode }) => <div className="space-y-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">{children}</div>,
    'grid-container': ({ children }: { children: React.ReactNode }) => <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mt-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">{children}</div>,
};

// Main Renderer Engine
export const A2UIRenderer: React.FC<{ component: A2UIComponent }> = ({ component }) => {
    const Component = A2UIRegistry[component.type];

    if (!Component) {
        return (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold font-mono">
                [SYSTEM_ERROR] Unknown Interface Node: {component.type}
            </div>
        );
    }

    return (
        <Component {...component.props}>
            {component.children?.map((child) => (
                <A2UIRenderer key={child.id} component={child} />
            ))}
        </Component>
    );
};
