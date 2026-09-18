import { Platform } from 'react-native';

const defaultUrl = 'http://localhost:4000/api';

export const API_BASE_URL = defaultUrl;

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || 'Request failed');
  }

  return data as T;
}

export const isAndroid = Platform.OS === 'android';
