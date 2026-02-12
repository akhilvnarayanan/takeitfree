import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import {
  getCurrentUser,
  login as storageLogin,
  register as storageRegister,
  logout as storageLogout,
  updateUser as storageUpdateUser,
  seedData,
  User,
} from "@/lib/storage";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, location: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<User, "name" | "location" | "profilePhoto">>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const u = await getCurrentUser();
    setUser(u);
  }, []);

  useEffect(() => {
    (async () => {
      await seedData();
      await refreshUser();
      setLoading(false);
    })();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const u = await storageLogin(email, password);
    setUser(u);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, location: string) => {
      const u = await storageRegister(name, email, password, location);
      setUser(u);
    },
    []
  );

  const logout = useCallback(async () => {
    await storageLogout();
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<Pick<User, "name" | "location" | "profilePhoto">>) => {
      if (!user) return;
      const updated = await storageUpdateUser(user.id, updates);
      setUser(updated);
    },
    [user]
  );

  const value = useMemo(
    () => ({ user, loading, login, register, logout, updateProfile, refreshUser }),
    [user, loading, login, register, logout, updateProfile, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
