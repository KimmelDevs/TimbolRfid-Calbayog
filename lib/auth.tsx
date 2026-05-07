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

  // Tracks UIDs where we've already loaded the profile inline (login/signup),
  // so the auth listener doesn't trigger a redundant fetchProfile.
  const profileLoadedForUid = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Single source of truth: onAuthStateChange fires immediately with the
    // current session on mount (INITIAL_SESSION event), so we do NOT also call
    // getSession() — that caused a double-fetch race where both paths ran
    // fetchProfile concurrently and set loading=false at different times.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (cancelled) return;

        setSession(newSession);

        if (!newSession?.user) {
          setUser(null);
          setLoading(false);
          return;
        }

        const uid = newSession.user.id;

        // If login() or signup() already fetched the profile for this uid,
        // skip the fetch — user state is already set correctly.
        if (profileLoadedForUid.current === uid) {
          profileLoadedForUid.current = null;
          setLoading(false);
          return;
        }

        if (
          event === "INITIAL_SESSION" ||
          event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED" ||
          event === "USER_UPDATED"
        ) {
          const profile = await fetchProfile(uid);
          if (!cancelled) {
            if (profile) setUser(profile);
            else setUser(null);
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (email: string, password: string): Promise<Role | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      console.error("[auth] login error:", error?.message);
      return null;
    }

    const profile = await fetchProfile(data.user.id);

    if (!profile) {
      console.error("[auth] login: profile not found for", data.user.id);
      await supabase.auth.signOut();
      return null;
    }

    // Mark uid so the auth listener skips its own fetchProfile call.
    profileLoadedForUid.current = data.user.id;
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
      profileLoadedForUid.current = newUser.id;
      setSession(authData.session);
      setUser(profile);
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