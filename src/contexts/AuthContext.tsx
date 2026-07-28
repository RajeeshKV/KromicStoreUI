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
  registerTenant: (
    email: string,
    firstName: string,
    lastName: string,
    password: string,
    confirmPassword: string,
    country: string
  ) => Promise<any>;
  logout: () => Promise<void>;
  setTenantId: (tenantId: string | null) => void;
}

const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('JWT parse error:', e);
    return null;
  }
};

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
      const isSuperEmail = email === 'admin@kromicstore.com' || email === 'admin@kromic-store.com';
      const url = isSuperEmail ? '/api/v1/superuser/auth/login' : '/api/v1/auth/login';
      const response = await apiClient.post(url, { email, password });
      
      const resData = response.data.data || response.data;
      const { accessToken, refreshToken, userId, email: resEmail, firstName, lastName } = resData;

      // Extract tenantId and roles from JWT claims
      const claims = parseJwt(accessToken);
      const newTenantId = claims?.tenant_id || claims?.tenantId || resData.tenantId || null;
      
      // Decrypt Microsoft claim URI or standard role parameter
      const claimRole = claims?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || claims?.role;
      const parsedRoles = Array.isArray(claimRole) ? claimRole : claimRole ? [claimRole] : [];
      
      const isSuper = isSuperEmail || parsedRoles.includes('SuperUser');
      const userRoles = isSuper ? ['SuperUser'] : parsedRoles.length > 0 ? parsedRoles : ['TenantAdmin'];

      const userData: User = {
        id: userId,
        email: resEmail || email,
        firstName: firstName || '',
        lastName: lastName || '',
        roles: userRoles,
        tenantId: newTenantId,
      };

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      
      if (newTenantId) {
        setTenantId(newTenantId);
      }

      return userData;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const registerTenant = async (
    email: string,
    firstName: string,
    lastName: string,
    password: string,
    confirmPassword: string,
    country: string
  ): Promise<any> => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/api/v1/auth/register', {
        email,
        firstName,
        lastName,
        password,
        confirmPassword,
        country,
        FirstName: firstName,
        LastName: lastName,
        ConfirmPassword: confirmPassword
      });

      const resData = response.data.data || response.data;
      const { accessToken, refreshToken, userId, email: resEmail, firstName: resFirstName, lastName: resLastName } = resData;

      // Extract tenantId from JWT claims
      const claims = parseJwt(accessToken);
      const newTenantId = claims?.tenant_id || claims?.tenantId || resData.tenantId || null;

      // Automatically log in the TenantAdmin
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      const adminUser: User = {
        id: userId,
        email: resEmail || email,
        firstName: resFirstName || firstName || '',
        lastName: resLastName || lastName || '',
        roles: ['TenantAdmin'],
        tenantId: newTenantId,
      };

      localStorage.setItem('user', JSON.stringify(adminUser));
      setUser(adminUser);
      setTenantId(newTenantId);

      return resData;
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
