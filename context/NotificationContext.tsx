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

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            {notification && (
                <div className={`fixed top-20 right-4 z-[9999] flex items-center gap-3 px-4 py-3 rounded shadow-2xl border transition-all duration-300 animate-in fade-in slide-in-from-right-5 ${notification.type === 'success' ? 'bg-zinc-900 border-green-500 text-green-500' :
                        notification.type === 'error' ? 'bg-zinc-900 border-red-500 text-red-500' :
                            notification.type === 'warning' ? 'bg-zinc-900 border-yellow-500 text-yellow-500' :
                                'bg-zinc-900 border-blue-500 text-blue-500'
                    }`}>
                    <span className="material-symbols-outlined text-lg">
                        {notification.type === 'success' ? 'check_circle' :
                            notification.type === 'error' ? 'error' :
                                notification.type === 'warning' ? 'warning' : 'info'}
                    </span>
                    <div>
                        <h4 className="font-bold uppercase text-[10px] tracking-wider">
                            {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                        </h4>
                        <p className="text-xs text-white/90 mt-0.5">{notification.message}</p>
                    </div>
                    <button onClick={() => setNotification(null)} className="ml-2 hover:bg-white/10 rounded p-1">
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>
            )}
        </NotificationContext.Provider>
    );
};
