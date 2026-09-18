import { request } from './apiService';

export type AuthUser = {
  userId: string;
  email: string;
  name: string;
};

export const register = async (name: string, email: string, password: string) =>
  request<{ user: AuthUser; token: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });

export const login = async (email: string, password: string) =>
  request<{ user: AuthUser; token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const getCurrentUser = () => request<{ user: AuthUser }>('/auth/me');
