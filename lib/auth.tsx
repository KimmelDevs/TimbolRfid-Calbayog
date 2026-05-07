"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
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

function rowToUser(data: Record<string, unknown>): User {
  return {
    id:      data.id as string,
    name:    data.full_name as string,
    email:   data.email as string,
    role:    data.role as Role,
    balance: (data.balance as number) ?? 0,
    rfidUid: (data.rfid_uid as string) ?? undefined,
    avatar:  (data.avatar as string) ?? undefined,
  };
}

async function fetchProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("jeepneyriders")
    .select("id, full_name, email, role, balance, rfid_uid, avatar")
    .eq("id", userId)
    .single();

  if (error || !data) {
    console.error("[auth] fetchProfile error:", error?.message);
    return null;
  }
  return rowToUser(data);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const skipFetchForUid = useRef<string | null>(null);

  useEffect(() => {
    // First, eagerly restore session from storage — don't wait for the listener
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        setLoading(false);
        return;
      }
      setSession(session);
      // If login/signup already set the user, skip the fetch
      if (skipFetchForUid.current === session.user.id) {
        skipFetchForUid.current = null;
        setLoading(false);
        return;
      }
      const profile = await fetchProfile(session.user.id);
      if (profile) setUser(profile);
      setLoading(false);
    });

    // Then keep listening for future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);

      if (!session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Skip if getSession already handled this uid
      if (skipFetchForUid.current === session.user.id) {
        skipFetchForUid.current = null;
        setLoading(false);
        return;
      }

      // Only re-fetch on meaningful events, not every tick
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        const profile = await fetchProfile(session.user.id);
        if (profile) setUser(profile);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (email: string, password: string): Promise<Role | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      console.error("[auth] login error:", error?.message);
      return null;
    }

    skipFetchForUid.current = data.user.id;
    const profile = await fetchProfile(data.user.id);

    if (!profile) {
      console.error("[auth] login: profile not found for", data.user.id);
      skipFetchForUid.current = null;
      await supabase.auth.signOut();
      return null;
    }

    setSession(data.session);
    setUser(profile);
    setLoading(false);
    return profile.role;
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    role: Role
  ): Promise<boolean> => {
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });

    if (authError || !authData.user) {
      console.error("[auth] signup error:", authError?.message);
      return false;
    }

    const newUser = authData.user;

    const { error: dbError } = await supabase.from("jeepneyriders").insert({
      id:        newUser.id,
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

    const profile: User = { id: newUser.id, name, email, role, balance: 0 };

    if (authData.session) {
      skipFetchForUid.current = newUser.id;
      setSession(authData.session);
      setUser(profile);
      setLoading(false);
    } else {
      setLoading(false);
    }

    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const refreshProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const profile = await fetchProfile(session.user.id);
    if (profile) setUser(profile);
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