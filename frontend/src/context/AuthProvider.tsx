import { useState, useEffect, ReactNode } from 'react';
import { AuthContext, AuthContextType } from './AuthContext';

// Helper function to decode a JWT token
function decodeToken(token: string): { id: string; username: string } | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1])); // Decode the payload
    return { id: payload.id, username: payload.username }; // Extract id and username
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null; // Return null if decoding fails
  }
}

// Manages state (token and user) and provides login/logout functions
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // State to store the authentication token, initialized from localStorage
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('token')
  );

  // State to store the user object (id and username)
  const [user, setUser] = useState<null | { id: string; username: string }>(
    null
  );

  // Effect to synchronize the token with localStorage and decode it
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      const decoded = decodeToken(token);
      if (decoded) {
        setUser(decoded);
      } else {
        setUser(null);
      }
    } else {
      localStorage.removeItem('token');
      setUser(null); // Clear user state when token is removed
    }
  }, [token]);

  // Function to log in by setting the token and decoding it for user info
  const login = (newToken: string) => {
    setToken(newToken);
    const decoded = decodeToken(newToken);
    if (decoded) {
      setUser(decoded);
    }
  };

  // Function to log out by clearing the token and user state
  const logout = () => {
    setToken(null);
    setUser(null);
  };

  // The value provided to the AuthContext consumers
  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
