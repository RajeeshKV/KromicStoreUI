import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  tenantId?: string | null;
}

interface AuthContextType {
  user: User | null;
  tenantId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  registerTenant: (companyName: string, subdomain: string, email: string, password: string, country: string) => Promise<any>;
  logout: () => Promise<void>;
  setTenantId: (tenantId: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tenantId, setSelectedTenantIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setTenantId = (id: string | null) => {
    setSelectedTenantIdState(id);
    if (id) {
      localStorage.setItem('tenantId', id);
    } else {
      localStorage.removeItem('tenantId');
    }
  };

  useEffect(() => {
    // Load initial state from local storage
    const storedUser = localStorage.getItem('user');
    const storedTenant = localStorage.getItem('tenantId');
    const token = localStorage.getItem('accessToken');

    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        // If the user has a tenant, enforce it. Otherwise, default to whatever was selected
        if (parsedUser.tenantId) {
          setSelectedTenantIdState(parsedUser.tenantId);
          localStorage.setItem('tenantId', parsedUser.tenantId);
        } else if (storedTenant) {
          setSelectedTenantIdState(storedTenant);
        }
      } catch (e) {
        // Corrupted user data in localStorage, clean up
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    } else if (storedTenant) {
      setSelectedTenantIdState(storedTenant);
    }

    setIsLoading(false);

    // Listen for logout events dispatched by the apiClient interceptor
    const handleLogout = () => {
      setUser(null);
      // We do not clear selected tenantId here so that if a customer is logged out they remain in the storefront
    };

    window.addEventListener('auth-logout', handleLogout);
    return () => window.removeEventListener('auth-logout', handleLogout);
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const isSuper = email === 'admin@kromicstore.com' || email === 'admin@kromic-store.com';
      const url = isSuper ? '/api/v1/superuser/auth/login' : '/api/v1/auth/login';
      const response = await apiClient.post(url, { email, password });
      const { accessToken, refreshToken, user: userData } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      
      // If user belongs to a tenant, set it.
      if (userData.tenantId) {
        setTenantId(userData.tenantId);
      }

      return userData as User;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const registerTenant = async (
    companyName: string,
    subdomain: string,
    email: string,
    password: string,
    country: string
  ): Promise<any> => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/api/v1/auth/register', {
        companyName,
        subdomain,
        email,
        password,
        country,
      });

      const { accessToken, refreshToken, tenantId: newTenantId, userId } = response.data.data;

      // Automatically log in the TenantAdmin
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      const adminUser: User = {
        id: userId,
        email,
        roles: ['TenantAdmin'],
        tenantId: newTenantId,
      };

      localStorage.setItem('user', JSON.stringify(adminUser));
      setUser(adminUser);
      setTenantId(newTenantId);

      return response.data.data;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const isSuper = user?.roles?.includes('SuperUser') || user?.tenantId === null;
        const logoutUrl = isSuper ? '/api/v1/superuser/auth/logout' : '/api/v1/auth/logout';
        await apiClient.post(logoutUrl).catch(() => {});
      }
    } catch (error) {
      console.warn('Backend logout failed', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const value = {
    user,
    tenantId,
    isAuthenticated: !!user,
    isLoading,
    login,
    registerTenant,
    logout,
    setTenantId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
