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
                    className={`flex items-center gap-4 px-6 py-4 rounded-xl shadow-2xl border-4 ${notification.type === 'success' ? 'bg-black border-green-500 text-green-500' :
                        notification.type === 'error' ? 'bg-black border-red-500 text-red-500' :
                            notification.type === 'warning' ? 'bg-black border-yellow-500 text-yellow-500' :
                                'bg-black border-blue-500 text-blue-500'
                        }`}
                >
                    <div className="flex-1">
                        <h4 className="font-black uppercase text-xs tracking-[0.2em] mb-1">
                            {notification.type === 'error' ? '🚨 CRITICAL' :
                                notification.type === 'warning' ? '⚠️ WARNING' : 'ℹ️ INFO'}
                        </h4>
                        <p className="text-sm text-white font-bold">{notification.message}</p>
                    </div>
                    <button
                        onClick={() => {
                            console.log("Closing notification manually");
                            setNotification(null);
                        }}
                        className="bg-white/10 hover:bg-white/20 rounded-full p-2"
                    >
                        <span className="material-symbols-outlined text-lg text-white">close</span>
                    </button>
                </div>
            )}
        </NotificationContext.Provider>
    );
};
