import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [registeredUsers, setRegisteredUsers] = useState<Map<string, { password: string; name: string }>>(new Map());

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedUsers = localStorage.getItem('registeredUsers');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
    if (storedUsers) {
      try {
        setRegisteredUsers(new Map(JSON.parse(storedUsers)));
      } catch (error) {
        console.error('Error parsing stored users:', error);
      }
    }

    // Ensure a demo user exists for local/dev access
    setTimeout(() => {
      setRegisteredUsers(prev => {
        const copy = new Map(prev);
        if (!copy.has('demo@farmassist.com')) {
          copy.set('demo@farmassist.com', { password: 'demo123', name: 'Demo User' });
          try {
            localStorage.setItem('registeredUsers', JSON.stringify(Array.from(copy.entries())));
          } catch (e) {
            console.error('Failed to persist demo user:', e);
          }
        }
        return copy;
      });
    }, 0);

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      const response = await fetch('http://your-backend/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const userData: User = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        setIsLoading(false);
        return true;
      }
    } catch (err) {
      // Backend unreachable or errored; fall through to local-user check
      console.warn('Auth backend unreachable, falling back to local users:', err);
    }

    // Fallback: check local registered users stored in state
    const local = registeredUsers.get(email);
    if (local && local.password === password) {
      const userData: User = {
        id: email,
        email,
        name: local.name,
      };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      setIsLoading(false);
      return true;
    }

    setIsLoading(false);
    return false;
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (registeredUsers.has(email)) {
      setIsLoading(false);
      return false;
    }
    
    const updatedUsers = new Map(registeredUsers);
    updatedUsers.set(email, { password, name });
    setRegisteredUsers(updatedUsers);
    localStorage.setItem('registeredUsers', JSON.stringify(Array.from(updatedUsers.entries())));
    
    const userData: User = {
      id: email,
      email,
      name,
    };
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

