import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('admin_token');
        if (token) {
            try {
                const response = await authAPI.me();
                setUser(response.data);
            } catch (error) {
                localStorage.removeItem('admin_token');
                localStorage.removeItem('admin_user');
            }
        }
        setLoading(false);
    };

    const login = async (email, password) => {
        const response = await authAPI.login(email, password);
        const { access_token } = response.data;
        localStorage.setItem('admin_token', access_token);
        await checkAuth();
        return response;
    };

    const logout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        setUser(null);
    };

    const value = {
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
