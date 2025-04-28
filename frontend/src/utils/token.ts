// Utility to get the JWT token from localStorage
export function getToken(): string | null {
  return localStorage.getItem('token');
}
