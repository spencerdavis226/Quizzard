import { createContext } from 'react';

// Define the shape of the AuthContext
export interface AuthContextType {
  user: null | { id: string; username: string };
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
