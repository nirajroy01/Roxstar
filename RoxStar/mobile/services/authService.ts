import { clearAuthToken, request, saveAuthToken } from './apiService';

export type AuthUser = {
  userId: string;
  email: string;
  name: string;
};

export const register = async (name: string, email: string, password: string) => {
  const result = await request<{ user: AuthUser; token: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  await saveAuthToken(result.token);
  return result;
};

export const login = async (email: string, password: string) => {
  const result = await request<{ user: AuthUser; token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  await saveAuthToken(result.token);
  return result;
};

export const getCurrentUser = () => request<{ user: AuthUser }>('/auth/me');

export const logout = async (): Promise<void> => {
  await clearAuthToken();
};
