"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axios';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in on initial load
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
          setLoading(false);
          return;
        }
        
        // Fetch user profile
        const response = await axiosInstance.get('/auth/profile');
        setUser(response.data);
      } catch (error) {
        console.error('Authentication error:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await axiosInstance.post('/auth/login', { email, password });
      
      const { accessToken, refreshToken, user } = response.data;
      
      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      setUser(user);
      router.push('/');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      const response = await axiosInstance.post('/auth/register', { name, email, password });
      
      const { accessToken, refreshToken, user } = response.data;
      
      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      setUser(user);
      router.push('/');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Remove tokens
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      logout, 
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};