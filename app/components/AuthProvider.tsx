'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface UserSession {
    id: number;
    username: string;
    email: string;
    role: string;
    permissions: string[];
}

interface AuthContextProps {
    user: UserSession | null;
    login: (u: UserSession) => void;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextProps>({
    user: null,
    login: () => { },
    logout: () => { },
    loading: true
});

export const useAuth = () => useContext(AuthContext);

const PUBLIC_ROUTES = ['/login', '/consultation'];

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserSession | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const isPublicRoute = PUBLIC_ROUTES.some(r => pathname.startsWith(r));

    useEffect(() => {
        const storedUser = localStorage.getItem('caution_user');
        let parsedUser = null;
        if (storedUser) {
            try { parsedUser = JSON.parse(storedUser); } catch { }
        }

        if (parsedUser) {
            setUser(parsedUser);
        } else {
            if (!isPublicRoute) {
                router.push('/login');
            }
        }
        setLoading(false);
    }, [pathname, router, isPublicRoute]);

    const login = (u: UserSession) => {
        setUser(u);
        localStorage.setItem('caution_user', JSON.stringify(u));
        router.push('/');
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('caution_user');
        router.push('/login');
    };

    if (loading) return null;

    if (!user && !isPublicRoute) {
        return null;
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}
