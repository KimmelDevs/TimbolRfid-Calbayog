"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

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
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<Role | null>;
  signup: (name: string, email: string, password: string, role: Role) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

// Builds a User from a Supabase session.
// Role comes from user_metadata (set at signup) — no extra DB roundtrip needed.
// Balance/rfidUid/avatar are fetched separately via refreshProfile when needed.
function sessionToUser(session: Session): User {
  const meta = session.user.user_metadata ?? {};
  return {
    id:      session.user.id,
    name:    (meta.name as string) ?? (session.user.email?.split("@")[0] ?? "User"),
    email:   session.user.email ?? "",
    role:    (meta.role as Role) ?? "resident",
    balance: (meta.balance as number) ?? 0,
    rfidUid: (meta.rfid_uid as string) ?? undefined,
    avatar:  (meta.avatar as string) ?? undefined,
  };
}

async function fetchProfileFromDB(userId: string): Promise<Partial<User> | null> {
  const { data, error } = await supabase
    .from("jeepneyriders")
    .select("full_name, balance, rfid_uid, avatar")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return {
    name:    data.full_name as string,
    balance: (data.balance as number) ?? 0,
    rfidUid: (data.rfid_uid as string) ?? undefined,
    avatar:  (data.avatar as string) ?? undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // onAuthStateChange fires INITIAL_SESSION immediately on mount with the
    // persisted session — this is the only auth source we need, no getSession() race.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (cancelled) return;

        setSession(newSession);

        if (!newSession) {
          setUser(null);
          setLoading(false);
          return;
        }

        // Build user immediately from metadata — no loading flicker
        const baseUser = sessionToUser(newSession);
        setUser(baseUser);

        // For INITIAL_SESSION (page refresh) and SIGNED_IN, enrich with DB data
        // (balance, rfidUid, avatar may differ from metadata)
        if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
          const extra = await fetchProfileFromDB(newSession.user.id);
          if (!cancelled && extra) {
            setUser(prev => prev ? { ...prev, ...extra } : prev);
          }
        }

        if (!cancelled) setLoading(false);
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (email: string, password: string): Promise<Role | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      console.error("[auth] login error:", error?.message);
      return null;
    }

    // Role is in user_metadata — available immediately, no DB fetch needed for routing
    const role = (data.session.user.user_metadata?.role as Role) ?? "resident";
    return role;
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    role: Role
  ): Promise<boolean> => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role, balance: 0 }, // store role in metadata for fast access
      },
    });

    if (authError || !authData.user) {
      console.error("[auth] signup error:", authError?.message);
      return false;
    }

    const { error: dbError } = await supabase.from("jeepneyriders").insert({
      id:        authData.user.id,
      full_name: name,
      email,
      role,
      balance:   0,
      rfid_uid:  null,
      avatar:    null,
    });

    if (dbError) {
      console.error("[auth] signup: profile insert error:", dbError.message);
      await supabase.auth.signOut();
      return false;
    }

    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const refreshProfile = async () => {
    const { data: { session: s } } = await supabase.auth.getSession();
    if (!s) return;
    const extra = await fetchProfileFromDB(s.user.id);
    if (extra) setUser(prev => prev ? { ...prev, ...extra } : prev);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, login, signup, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}