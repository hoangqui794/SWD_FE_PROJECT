import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
    message: string;
    type: NotificationType;
}

interface NotificationContextType {
    showNotification: (message: string, type: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

interface NotificationProviderProps {
    children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const [notification, setNotification] = useState<Notification | null>(null);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const showNotification = (message: string, type: NotificationType) => {
        setNotification({ message, type });
    };

    console.log("Rendering NotificationProvider, current notification:", notification);

    const getNotificationStyles = () => {
        switch (notification?.type) {
            case 'success':
                return {
                    color: '#10b981', // emerald-500
                    bg: 'rgba(16, 185, 129, 0.05)',
                    label: 'Success',
                    icon: 'check_circle'
                };
            case 'error':
                return {
                    color: '#f43f5e', // rose-500
                    bg: 'rgba(244, 63, 94, 0.05)',
                    label: 'Critical Error',
                    icon: 'error'
                };
            case 'warning':
                return {
                    color: '#f59e0b', // amber-500
                    bg: 'rgba(245, 158, 11, 0.05)',
                    label: 'Warning',
                    icon: 'warning'
                };
            default:
                return {
                    color: '#3b82f6', // blue-500
                    bg: 'rgba(59, 130, 246, 0.05)',
                    label: 'Info',
                    icon: 'info'
                };
        }
    };

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            {notification && (() => {
                const styles = getNotificationStyles();
                return (
                    <div
                        style={{
                            position: 'fixed',
                            bottom: '32px',
                            right: '32px',
                            zIndex: 999999,
                        }}
                        className="animate-[toastIn_0.4s_cubic-bezier(0.16,1,0.3,1)]"
                    >
                        <div className="relative flex items-center gap-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 pr-12 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)] min-w-[340px] max-w-md overflow-hidden group">
                            {/* Side Accent Bar */}
                            <div
                                className="absolute left-0 top-0 bottom-0 w-1.5"
                                style={{ backgroundColor: styles.color }}
                            />

                            {/* Icon Wrapper */}
                            <div
                                className="flex items-center justify-center w-10 h-10 rounded-xl"
                                style={{ backgroundColor: styles.bg, color: styles.color }}
                            >
                                <span className="material-symbols-outlined text-2xl">{styles.icon}</span>
                            </div>

                            {/* Content */}
                            <div className="flex flex-col">
                                <span
                                    className="text-[10px] font-black uppercase tracking-[0.1em] mb-0.5"
                                    style={{ color: styles.color }}
                                >
                                    {styles.label}
                                </span>
                                <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                                    {notification.message}
                                </p>
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={() => setNotification(null)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 dark:hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>

                            {/* Timer Progress */}
                            <div className="absolute bottom-0 left-1.5 right-0 h-0.5 bg-slate-50 dark:bg-white/5 overflow-hidden">
                                <div
                                    className="h-full animate-[toastProgress_3s_linear]"
                                    style={{ backgroundColor: styles.color }}
                                />
                            </div>
                        </div>
                    </div>
                );
            })()}

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes toastIn {
                    from { transform: translateY(20px) scale(0.95); opacity: 0; }
                    to { transform: translateY(0) scale(1); opacity: 1; }
                }
                @keyframes toastProgress {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}} />
        </NotificationContext.Provider>
    );
};
