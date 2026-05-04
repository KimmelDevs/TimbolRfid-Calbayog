"use client";
import { createContext, useContext, useState, ReactNode } from "react";

export type Role = "resident" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  rfidUid?: string;
  balance: number;
  avatar?: string;
}

interface AuthCtx {
  user: User | null;
  login: (email: string, password: string) => Promise<"resident" | "admin" | null>;
  signup: (name: string, email: string, password: string, role: Role) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

// Mock users database
const MOCK_USERS: (User & { password: string })[] = [
  {
    id: "1",
    name: "Maria Santos",
    email: "maria@timbol.ph",
    password: "resident123",
    role: "resident",
    rfidUid: "A3F209B1",
    balance: 245.50,
  },
  {
    id: "2",
    name: "Admin Reyes",
    email: "admin@timbol.ph",
    password: "admin123",
    role: "admin",
    balance: 0,
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    await new Promise((r) => setTimeout(r, 900));
    const found = MOCK_USERS.find(
      (u) => u.email === email && u.password === password
    );
    if (!found) return null;
    const { password: _, ...safe } = found;
    setUser(safe);
    return safe.role;
  };

  const signup = async (name: string, email: string, _password: string, role: Role) => {
    await new Promise((r) => setTimeout(r, 900));
    const newUser: User = {
      id: String(Date.now()),
      name,
      email,
      role,
      balance: 0,
      rfidUid: role === "resident" ? "PENDING" : undefined,
    };
    setUser(newUser);
    return true;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
