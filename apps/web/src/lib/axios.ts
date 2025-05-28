import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Add token to request if available
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (!error.response) {
      console.error('Network error:', error);
      return Promise.reject(new Error('Network error - please check your connection'));
    }

    const originalRequest = error.config;
    
    // If error is 401 (Unauthorized) and we haven't tried to refresh the token yet
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // No refresh token, redirect to login
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        const response = await axiosInstance.post('/auth/refresh', {
          refreshToken,
        });
        
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        // Store new tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        // Update authorization header
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Failed to refresh token, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;