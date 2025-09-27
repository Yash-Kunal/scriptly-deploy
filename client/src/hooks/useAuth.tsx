import { useState, useEffect, createContext, useContext } from 'react';

type User = {
  email: string;
  username: string;
} | null;

interface AuthContextType {
  token: string | null;
  user: User;
  login: (jwt: string, userObj: { email: string; username: string }) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User>(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null
  );

  const login = (jwt: string, userObj: { email: string; username: string }) => {
    setToken(jwt);
    setUser(userObj);
    localStorage.setItem('token', jwt);
    localStorage.setItem('user', JSON.stringify(userObj));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Effect for token expiration or other auth state changes
  useEffect(() => {
    // You could add token validation logic here
  }, [token]);

  return (
    <AuthContext.Provider value={{ 
      token, 
      user, 
      login, 
      logout,
      isAuthenticated: !!token && !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};