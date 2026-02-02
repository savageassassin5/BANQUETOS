import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
            // Verify token is still valid and get full user data with features
            authAPI.getMe()
                .then(res => {
                    setUser(res.data);
                    localStorage.setItem('user', JSON.stringify(res.data));
                })
                .catch(() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const response = await authAPI.login({ email, password });
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        return user;
    };

    const register = async (data) => {
        const response = await authAPI.register(data);
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        return user;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    // Role checks
    const isSuperAdmin = user?.role === 'super_admin';
    const isTenantAdmin = user?.role === 'tenant_admin';
    const isAdmin = user?.role === 'admin' || user?.role === 'tenant_admin';
    const isStaff = user?.role === 'staff' || isAdmin;
    
    // Feature check helper
    const hasFeature = (feature) => {
        if (isSuperAdmin) return true;
        return user?.effective_features?.[feature] === true;
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            loading, 
            login, 
            register, 
            logout, 
            isSuperAdmin,
            isTenantAdmin,
            isAdmin, 
            isStaff,
            hasFeature
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
