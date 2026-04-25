import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  isAdmin?: boolean;
}

interface AuthOverview {
  database_path: string;
  summary: {
    total_users: number;
    total_logins: number;
    failed_logins: number;
    latest_activity_at: string | null;
  };
  users: Array<{
    id: string;
    email: string;
    name: string;
    created_at: string;
    last_login_at: string | null;
    login_count: number;
  }>;
  events: Array<{
    id: number;
    user_id: string | null;
    email: string;
    event_type: string;
    status: string;
    details: string | null;
    occurred_at: string;
  }>;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  getAuthOverview: () => Promise<AuthOverview | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const API_BASE_URL = "http://localhost:8000";

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on load
  useEffect(() => {
    const storedUser = localStorage.getItem("farm_user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        // Ensure isAdmin is preserved from storage
        if (parsed.email) {
          parsed.isAdmin = parsed.email.toLowerCase() === "admin@farmassist.com";
        }
        setUser(parsed);
      } catch {
        localStorage.removeItem("farm_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Login error:", error.detail);
        setIsLoading(false);
        return false;
      }

      const data = await response.json();
      const isAdmin = email.toLowerCase() === "admin@farmassist.com";
      const userData = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        isAdmin,
      };

      setUser(userData);
      localStorage.setItem("farm_user", JSON.stringify(userData));
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Register error:", error.detail);
        setIsLoading(false);
        return false;
      }

      const data = await response.json();
      const userData = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        isAdmin: false,
      };

      setUser(userData);
      localStorage.setItem("farm_user", JSON.stringify(userData));
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Register error:", error);
      setIsLoading(false);
      return false;
    }
  };

  const getAuthOverview = async (): Promise<AuthOverview | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/overview`);
      if (!response.ok) {
        console.error("Failed to fetch auth overview");
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching auth overview:", error);
      return null;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("farm_user");
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    register,
    getAuthOverview,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
