import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check login status on mount
    useEffect(() => {
        const handleUnauthorized = () => {
            console.log('🛡️ Auth Guard: Clearing stale session.');
            setUser(null);
        };

        window.addEventListener('unauthorized', handleUnauthorized);

        api.status()
            .then((data) => setUser(data.user))
            .catch(() => setUser(null))
            .finally(() => setLoading(false));

        return () => window.removeEventListener('unauthorized', handleUnauthorized);
    }, []);

    const login = async (email, password) => {
        const data = await api.login({ email, password });
        setUser(data.user);
        return data;
    };

    const register = async (name, email, password, role) => {
        const data = await api.register({ name, email, password, role });
        setUser(data.user);
        return data;
    };

    const logout = async () => {
        await api.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
