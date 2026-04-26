export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function authHeaders(token: string | null): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}
