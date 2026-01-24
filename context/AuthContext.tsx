import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Role } from '../types/auth';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (user: User, token: string) => void;
    logout: () => void;
    hasRole: (requiredRole: Role[]) => boolean;
}

import { authService } from '../services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                try {
                    const userData = await authService.getCurrentUser();
                    // Normalize role to match our Type definition
                    const normalizedUser = {
                        ...userData,
                        role: userData.role.toUpperCase() as Role
                    };
                    setUser(normalizedUser);
                    localStorage.setItem('user', JSON.stringify(normalizedUser));
                } catch (error) {
                    console.error('Session verification failed:', error);
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                    setUser(null);
                }
            }
            setIsLoading(false);
        };
        checkAuth();
    }, []);

    const login = (userData: User, token: string) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    const hasRole = (requiredRoles: Role[]) => {
        if (!user) return false;
        return requiredRoles.includes(user.role);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            login,
            logout,
            hasRole
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
