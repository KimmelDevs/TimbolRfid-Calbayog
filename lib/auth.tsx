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

async function fetchProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("jeepneyriders")
    .select("id, full_name, email, role, balance, rfid_uid, avatar")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("[auth] fetchProfile error:", error.message);
    return null;
  }
  if (!data) return null;

  return {
    id: data.id,
    name: data.full_name,
    email: data.email,
    role: data.role as Role,
    balance: data.balance ?? 0,
    rfidUid: data.rfid_uid ?? undefined,
    avatar: data.avatar ?? undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // When true, onAuthStateChange skips its fetchProfile — caller handles it
  const suppressAuthChange = useRef(false);

  useEffect(() => {
    // Restore session on mount / page refresh
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser(profile);
      }
      setLoading(false);
    });

    // Handles token refresh & external sign-out only.
    // login() and signup() suppress this to avoid a duplicate fetchProfile.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (suppressAuthChange.current) return;

      setSession(session);

      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        // profile may be null briefly during signup before the row is inserted
        if (profile) setUser(profile);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (email: string, password: string): Promise<Role | null> => {
    suppressAuthChange.current = true;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        console.error("[auth] login error:", error?.message);
        return null;
      }

      const profile = await fetchProfile(data.user.id);

      if (!profile) {
        console.error("[auth] login: profile not found for user", data.user.id);
        // Sign out so the user isn't stuck in a half-authenticated state
        await supabase.auth.signOut();
        return null;
      }

      setSession(data.session);
      setUser(profile);
      return profile.role;
    } finally {
      // Always release suppression — even if an exception is thrown
      suppressAuthChange.current = false;
    }
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    role: Role
  ): Promise<boolean> => {
    // Suppress onAuthStateChange — the jeepneyriders row doesn't exist yet
    // when Supabase fires SIGNED_IN, so fetchProfile would return null.
    suppressAuthChange.current = true;

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError || !authData.user) {
        console.error("[auth] signup error:", authError?.message);
        return false;
      }

      // Insert profile row BEFORE releasing suppression
      const { error: dbError } = await supabase.from("jeepneyriders").insert({
        id: authData.user.id,
        full_name: name,
        email: email,
        role: role,
        balance: 0,
        rfid_uid: null,
        avatar: null,
      });

      if (dbError) {
        console.error("[auth] signup: profile insert error:", dbError.message);
        // Clean up the auth user so they can try again
        await supabase.auth.signOut();
        return false;
      }

      // If email confirmation is disabled, session exists immediately
      if (authData.session) {
        const profile = await fetchProfile(authData.user.id);
        setSession(authData.session);
        setUser(profile);
      }

      return true;
    } finally {
      suppressAuthChange.current = false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  // Call this to re-fetch the profile from the DB (e.g. after updating avatar/balance)
  const refreshProfile = async () => {
    if (!session?.user) return;
    const profile = await fetchProfile(session.user.id);
    if (profile) setUser(profile);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, login, signup, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}