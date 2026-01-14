'use client';

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { Admin } from '../types/models';

/** Authentication context value */
export interface AuthContextValue {
    /** Whether authentication check is in progress */
    isLoading: boolean;
    /** Whether user is authenticated */
    isAuthenticated: boolean;
    /** Current user info */
    user: Admin | null;
    /** Current access token */
    token: string | null;
    /** Login and store credentials */
    login: (token: string, refreshToken: string, user: Admin) => void;
    /** Logout and clear credentials */
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Storage keys */
const STORAGE_KEYS = {
    accessToken: 'admin_access_token',
    refreshToken: 'admin_refresh_token',
    userInfo: 'admin_info',
} as const;

interface AuthProviderProps {
    children: ReactNode;
}

/**
 * Auth Provider component
 * 
 * Manages authentication state and provides it to the app
 */
export function AuthProvider({ children }: AuthProviderProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<Admin | null>(null);
    const [token, setToken] = useState<string | null>(null);

    // Initialize auth state from localStorage (client-side only)
    useEffect(() => {
        // SSR safety check
        if (typeof window === 'undefined') {
            return;
        }

        const storedToken = localStorage.getItem(STORAGE_KEYS.accessToken);
        const storedUserInfo = localStorage.getItem(STORAGE_KEYS.userInfo);

        if (storedToken) {
            setToken(storedToken);
            setIsAuthenticated(true);
            if (storedUserInfo) {
                try {
                    setUser(JSON.parse(storedUserInfo));
                } catch {
                    // Invalid JSON, clear it
                    localStorage.removeItem(STORAGE_KEYS.userInfo);
                }
            }
        }

        setIsLoading(false);
    }, []);

    // Listen for storage changes (other tabs)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === STORAGE_KEYS.accessToken) {
                if (!e.newValue) {
                    // Token was removed
                    setToken(null);
                    setUser(null);
                    setIsAuthenticated(false);
                    router.replace('/login');
                } else {
                    // Token was added/updated
                    setToken(e.newValue);
                    setIsAuthenticated(true);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [router]);

    const login = useCallback(
        (accessToken: string, refreshToken: string, userInfo: Admin) => {
            localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
            localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
            localStorage.setItem(STORAGE_KEYS.userInfo, JSON.stringify(userInfo));

            setToken(accessToken);
            setUser(userInfo);
            setIsAuthenticated(true);
        },
        []
    );

    const logout = useCallback(() => {
        localStorage.removeItem(STORAGE_KEYS.accessToken);
        localStorage.removeItem(STORAGE_KEYS.refreshToken);
        localStorage.removeItem(STORAGE_KEYS.userInfo);

        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        router.replace('/login');
    }, [router]);

    const value: AuthContextValue = {
        isLoading,
        isAuthenticated,
        user,
        token,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * Hook to access auth context
 * 
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
