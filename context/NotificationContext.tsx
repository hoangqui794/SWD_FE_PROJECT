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

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            {notification && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '40px',
                        right: '40px',
                        zIndex: 999999,
                        minWidth: '320px'
                    }}
                    className={`flex items-center gap-4 px-6 py-4 rounded-xl shadow-2xl border transition-all duration-300 ${notification.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400' :
                        notification.type === 'error' ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400' :
                            notification.type === 'warning' ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400' :
                                'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400'
                        }`}
                >
                    <div className="flex-1">
                        <h4 className="font-black uppercase text-[10px] tracking-[0.2em] mb-1 opacity-80">
                            {notification.type === 'error' ? '🚨 CRITICAL' :
                                notification.type === 'warning' ? '⚠️ WARNING' : 'ℹ️ INFO'}
                        </h4>
                        <p className="text-sm font-bold">{notification.message}</p>
                    </div>
                    <button
                        onClick={() => {
                            console.log("Closing notification manually");
                            setNotification(null);
                        }}
                        className="hover:bg-black/5 dark:hover:bg-white/10 rounded-full p-2 transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>
            )}
        </NotificationContext.Provider>
    );
};
