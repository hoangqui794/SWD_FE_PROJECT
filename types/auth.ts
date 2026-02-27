export type Role = 'ADMIN' | 'MANAGER' | 'STAFF';

export interface User {
    id: string;
    email: string;
    name: string;
    role: Role;
    token?: string; // Sometimes response has token
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

export interface LoginCredentials {
    email: string;
    password?: string;
}



export interface AuthResponse {
    token: string;
    user: User;
}
