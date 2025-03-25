import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import authService, {
  LoginCredentials,
  SignupCredentials,
} from "@/services/authService";

type User = {
  id: string;
  email: string;
  name: string;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user and token are stored in localStorage
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const credentials: LoginCredentials = { email, password };
      const response = await authService.login(credentials);

      // Store token and user data
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));

      setUser(response.user);

      toast({
        title: "Login successful",
        description: `Welcome back, ${response.user.name}!`,
      });
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const credentials: SignupCredentials = { email, password, name };
      const response = await authService.signup(credentials);

      // Store token and user data
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));

      setUser(response.user);

      toast({
        title: "Account created",
        description: `Welcome, ${name}!`,
      });
    } catch (error) {
      console.error("Signup error:", error);
      toast({
        title: "Signup failed",
        description: "Could not create your account. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
