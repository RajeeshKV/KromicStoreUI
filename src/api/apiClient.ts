import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

// Base URL of the deployed KromicStore API
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://kromicstoreapi.onrender.com';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string | PromiseLike<string>) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach access token and tenant ID dynamically
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Set Tenant ID for multi-tenant isolation
    const tenantId = localStorage.getItem('tenantId');
    if (tenantId) {
      config.headers['X-Tenant-Id'] = tenantId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle automatic token refreshing on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 Unauthorized and not a retry attempt
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't try to refresh if the request was to log in or register or refresh
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/refresh') ||
        originalRequest.url?.includes('/auth/register') ||
        originalRequest.url?.includes('/superuser/auth/login') ||
        originalRequest.url?.includes('/superuser/auth/refresh')
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue the request until token is refreshed
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        isRefreshing = false;
        // No refresh token available, logout user
        logoutUser();
        return Promise.reject(error);
      }

      try {
        // Check if the current user is a SuperUser to determine the refresh URL
        let isSuperUser = false;
        try {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            isSuperUser = parsedUser.roles?.includes('SuperUser') || parsedUser.tenantId === null;
          }
        } catch {}

        const refreshPath = isSuperUser ? '/api/v1/superuser/auth/refresh' : '/api/v1/auth/refresh';

        // Request token refresh
        const response = await axios.post(`${API_BASE_URL}${refreshPath}`, {
          refreshToken,
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;

        localStorage.setItem('accessToken', newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        // Refresh token failed/expired, clean credentials and force login
        logoutUser();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

function logoutUser() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  // Trigger custom storage event to notify context
  window.dispatchEvent(new Event('auth-logout'));
}

export default apiClient;
