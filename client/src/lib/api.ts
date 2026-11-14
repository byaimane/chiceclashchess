const API_URL = import.meta.env.PROD
  ? ''
  : import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function getToken(): string | null {
  return localStorage.getItem('chess_token');
}

export function setToken(token: string): void {
  localStorage.setItem('chess_token', token);
}

export function clearToken(): void {
  localStorage.removeItem('chess_token');
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data as T;
}
