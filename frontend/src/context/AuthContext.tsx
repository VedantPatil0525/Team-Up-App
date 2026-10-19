import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, setActiveUserId, getSavedUserId } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  availablePersonas: User[];
  isLoading: boolean;
  loginUser: (user: User) => void;
  logout: () => void;
  switchPersona: (userId: string) => Promise<void>;
  refreshPersonas: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [availablePersonas, setAvailablePersonas] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPersonas = async () => {
    try {
      const personas = await api.getPersonas();
      setAvailablePersonas(personas);

      if (personas.length > 0) {
        const savedId = getSavedUserId();
        if (savedId) {
          const active = personas.find((p) => p.id === savedId);
          if (active) {
            setActiveUserId(active.id);
            setCurrentUser(active);
          } else {
            setActiveUserId(null);
            setCurrentUser(null);
          }
        } else {
          // Do not auto-login: unauthenticated visitors must sign in explicitly
          setActiveUserId(null);
          setCurrentUser(null);
        }
      }
    } catch (err) {
      console.error('Failed to load employee personas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPersonas();
  }, []);

  const switchPersona = async (userId: string) => {
    setActiveUserId(userId);
    const target = availablePersonas.find((p) => p.id === userId);
    if (target) {
      setCurrentUser(target);
    } else {
      try {
        const user = await api.getCurrentPersona();
        setCurrentUser(user);
      } catch (err) {
        console.error('Failed to switch persona:', err);
      }
    }
  };

  const loginUser = (user: User) => {
    setActiveUserId(user.id);
    setCurrentUser(user);
    setAvailablePersonas((prev) => {
      const exists = prev.some((p) => p.id === user.id);
      return exists ? prev.map((p) => (p.id === user.id ? user : p)) : [user, ...prev];
    });
  };

  const logout = () => {
    setActiveUserId(null);
    setCurrentUser(null);
  };

  const refreshPersonas = async () => {
    await loadPersonas();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        availablePersonas,
        isLoading,
        loginUser,
        logout,
        switchPersona,
        refreshPersonas,
      }}
    >
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
