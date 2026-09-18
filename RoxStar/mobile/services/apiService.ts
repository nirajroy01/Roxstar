import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const configuredUrl = Constants.expoConfig?.extra?.apiBaseUrl;
if (typeof configuredUrl !== 'string' || !configuredUrl) {
  throw new Error('Missing Expo configuration: extra.apiBaseUrl');
}

export const API_BASE_URL = configuredUrl.replace(/\/+$/, '');
export const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');
const TOKEN_KEY = 'roxstar.auth.token';

export const saveAuthToken = async (token: string): Promise<void> => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const clearAuthToken = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

export const getAuthToken = async (): Promise<string | null> => {
  return SecureStore.getItemAsync(TOKEN_KEY);
};

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = await getAuthToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

