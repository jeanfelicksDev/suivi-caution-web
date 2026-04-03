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
    const [logoutDelay, setLogoutDelay] = useState(60); // minutes
    const router = useRouter();
    const pathname = usePathname();

    const isPublicRoute = PUBLIC_ROUTES.some(r => pathname.startsWith(r));

    useEffect(() => {
        const storedUser = sessionStorage.getItem('caution_user');
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
        
        // Fetch config
        fetch('/api/config', { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                if (data.logoutDelay) setLogoutDelay(data.logoutDelay);
            })
            .catch(err => console.error('Error fetching logout delay:', err));

        setLoading(false);
    }, [pathname, router, isPublicRoute]);

    const login = (u: UserSession) => {
        setUser(u);
        sessionStorage.setItem('caution_user', JSON.stringify(u));
        router.push('/');
    };

    const logout = React.useCallback(() => {
        setUser(null);
        sessionStorage.removeItem('caution_user');
        router.push('/login');
    }, [router]);

    // Inactivity logout
    useEffect(() => {
        if (!user || isPublicRoute) return;

        let timeoutId: NodeJS.Timeout;
        let lastReset = 0;

        const resetTimer = () => {
            const now = Date.now();
            // Don't reset more than once every 5 seconds to avoid performance hit on high-frequency events like mousemove
            if (now - lastReset < 5000) return;
            lastReset = now;

            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                console.log('Logging out due to inactivity');
                logout();
            }, logoutDelay * 60 * 1000);
        };

        // Events to monitor for activity
        const events = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'];

        // Add event listeners
        events.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        // Initialize timer (without throttle for first run)
        timeoutId = setTimeout(() => {
            console.log('Logging out due to inactivity');
            logout();
        }, logoutDelay * 60 * 1000);

        // Cleanup
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            events.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [user, isPublicRoute, logout, logoutDelay]);

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
