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
                    bg: 'bg-emerald-600 dark:bg-emerald-500',
                    text: 'text-white',
                    border: 'border-emerald-500 dark:border-emerald-400',
                    label: '✅ SUCCESS',
                    icon: 'check_circle'
                };
            case 'error':
                return {
                    bg: 'bg-red-600 dark:bg-red-500',
                    text: 'text-white',
                    border: 'border-red-500 dark:border-red-400',
                    label: '🚨 CRITICAL',
                    icon: 'error'
                };
            case 'warning':
                return {
                    bg: 'bg-amber-500 dark:bg-amber-400',
                    text: 'text-white',
                    border: 'border-amber-400 dark:border-amber-300',
                    label: '⚠️ WARNING',
                    icon: 'warning'
                };
            default:
                return {
                    bg: 'bg-blue-600 dark:bg-blue-500',
                    text: 'text-white',
                    border: 'border-blue-500 dark:border-blue-400',
                    label: 'ℹ️ INFO',
                    icon: 'info'
                };
        }
    };

    const styles = getNotificationStyles();

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            {notification && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '24px',
                        right: '24px',
                        zIndex: 999999,
                    }}
                    className={`flex items-start gap-4 p-4 rounded-xl shadow-2xl border transition-all duration-500 transform translate-y-0 animate-[slideIn_0.3s_ease-out] ${styles.bg} ${styles.text} ${styles.border} min-w-[320px] max-w-md`}
                >
                    <div className="mt-1">
                        <span className="material-symbols-outlined text-xl">{styles.icon}</span>
                    </div>
                    <div className="flex-1">
                        <h4 className="font-extrabold uppercase text-[9px] tracking-[0.15em] mb-0.5 opacity-90">
                            {styles.label}
                        </h4>
                        <p className="text-sm font-medium leading-relaxed">{notification.message}</p>
                    </div>
                    <button
                        onClick={() => setNotification(null)}
                        className="hover:bg-white/10 rounded-lg p-1 transition-colors -mr-1"
                    >
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>

                    {/* Progress bar for auto-close */}
                    <div className="absolute bottom-0 left-0 h-1 bg-white/20 rounded-b-xl overflow-hidden" style={{ width: '100%' }}>
                        <div className="h-full bg-white/40 animate-[progress_3s_linear]" />
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes progress {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}} />
        </NotificationContext.Provider>
    );
};
